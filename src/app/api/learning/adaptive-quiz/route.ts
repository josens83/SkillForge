import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import BKTEngine, {
  selectQuestionsForAdaptiveQuiz,
  DEFAULT_BKT_PARAMS,
  KnowledgeState,
} from '@/lib/bkt';

// 적응형 퀴즈 문제 생성
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const numQuestions = parseInt(searchParams.get('count') || '5');

    if (!courseId) {
      return NextResponse.json(
        { error: '코스 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 코스의 모든 레슨에서 퀴즈 가져오기
    const lessons = await prisma.lesson.findMany({
      where: {
        chapter: {
          courseId,
        },
        type: 'QUIZ',
      },
      select: {
        id: true,
        title: true,
        content: true,
        chapter: {
          select: {
            title: true,
          },
        },
      },
    });

    if (lessons.length === 0) {
      return NextResponse.json({
        quiz: [],
        message: '이 코스에는 퀴즈가 없습니다.',
      });
    }

    // 사용자의 지식 상태 조회
    const knowledgeComponents = await prisma.knowledgeComponent.findMany({
      where: {
        userId: session.user.id,
        courseId,
      },
    });

    // 지식 상태가 없는 경우 기본 퀴즈 반환
    if (knowledgeComponents.length === 0) {
      // 랜덤하게 퀴즈 선택
      const shuffledLessons = lessons.sort(() => Math.random() - 0.5);
      const selectedLessons = shuffledLessons.slice(0, numQuestions);

      const quiz = selectedLessons.map(lesson => {
        const content = lesson.content as any;
        return {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          chapterTitle: lesson.chapter.title,
          questions: content.questions || [],
          difficulty: 'medium',
          isAdaptive: false,
        };
      });

      return NextResponse.json({
        quiz,
        message: '아직 학습 데이터가 충분하지 않아 기본 퀴즈를 제공합니다.',
        knowledgeLevel: 0,
      });
    }

    // KnowledgeState 형식으로 변환
    const knowledgeStates: KnowledgeState[] = knowledgeComponents.map(kc => ({
      componentId: kc.id,
      componentName: kc.name,
      pKnown: kc.pKnown,
      attempts: kc.attempts,
      correctAttempts: kc.correctAttempts,
      lastUpdated: kc.lastAttempt,
    }));

    // BKT 엔진으로 문제 선택
    const bktEngine = new BKTEngine(DEFAULT_BKT_PARAMS);
    const questionSelections = selectQuestionsForAdaptiveQuiz(
      knowledgeStates,
      numQuestions,
      bktEngine
    );

    // 선택된 문제들로 퀴즈 구성
    const quiz = [];
    const usedLessonIds = new Set<string>();

    for (const selection of questionSelections) {
      // 해당 지식 컴포넌트와 관련된 레슨 찾기
      const relatedLessons = lessons.filter(lesson => {
        const content = lesson.content as any;
        // 레슨 제목이나 챕터 제목에 지식 컴포넌트 이름이 포함되어 있는지 확인
        const state = knowledgeStates.find(ks => ks.componentId === selection.componentId);
        if (!state) return false;

        const componentName = state.componentName.toLowerCase();
        return (
          !usedLessonIds.has(lesson.id) &&
          (lesson.title.toLowerCase().includes(componentName) ||
            lesson.chapter.title.toLowerCase().includes(componentName) ||
            componentName.includes(lesson.title.toLowerCase()))
        );
      });

      if (relatedLessons.length > 0) {
        const lesson = relatedLessons[0];
        usedLessonIds.add(lesson.id);

        const content = lesson.content as any;
        const state = knowledgeStates.find(ks => ks.componentId === selection.componentId);

        quiz.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          chapterTitle: lesson.chapter.title,
          questions: content.questions || [],
          difficulty: selection.difficulty,
          isAdaptive: true,
          knowledgeLevel: state ? Math.round(state.pKnown * 100) : 0,
          componentName: state?.componentName,
        });
      }
    }

    // 부족한 문제 수 채우기
    const remainingCount = numQuestions - quiz.length;
    if (remainingCount > 0) {
      const unusedLessons = lessons.filter(l => !usedLessonIds.has(l.id));
      const additionalLessons = unusedLessons
        .sort(() => Math.random() - 0.5)
        .slice(0, remainingCount);

      for (const lesson of additionalLessons) {
        const content = lesson.content as any;
        quiz.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          chapterTitle: lesson.chapter.title,
          questions: content.questions || [],
          difficulty: 'medium',
          isAdaptive: false,
          knowledgeLevel: null,
        });
      }
    }

    // 평균 지식 수준 계산
    const avgKnowledge = knowledgeStates.length > 0
      ? knowledgeStates.reduce((sum, ks) => sum + ks.pKnown, 0) / knowledgeStates.length
      : 0;

    return NextResponse.json({
      quiz,
      stats: {
        knowledgeLevel: Math.round(avgKnowledge * 100),
        componentsTracked: knowledgeStates.length,
        adaptiveQuestions: quiz.filter(q => q.isAdaptive).length,
      },
    });
  } catch (error) {
    console.error('Adaptive quiz error:', error);
    return NextResponse.json(
      { error: '적응형 퀴즈 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
