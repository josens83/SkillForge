import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import BKTEngine, {
  generateLearningRecommendations,
  selectQuestionsForAdaptiveQuiz,
  DEFAULT_BKT_PARAMS,
  DIFFICULTY_PARAMS,
  KnowledgeState,
} from '@/lib/bkt';

// 사용자의 지식 상태 조회
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
    const includeRecommendations = searchParams.get('recommendations') === 'true';

    // 지식 컴포넌트 조회
    const whereClause: any = { userId: session.user.id };
    if (courseId) {
      whereClause.courseId = courseId;
    }

    const knowledgeComponents = await prisma.knowledgeComponent.findMany({
      where: whereClause,
      orderBy: { lastAttempt: 'desc' },
    });

    // KnowledgeState 형식으로 변환
    const knowledgeStates: KnowledgeState[] = knowledgeComponents.map(kc => ({
      componentId: kc.id,
      componentName: kc.name,
      pKnown: kc.pKnown,
      attempts: kc.attempts,
      correctAttempts: kc.correctAttempts,
      lastUpdated: kc.lastAttempt,
    }));

    // 추천 생성 (선택적)
    let recommendations = null;
    if (includeRecommendations) {
      const bktEngine = new BKTEngine(DEFAULT_BKT_PARAMS);
      recommendations = generateLearningRecommendations(knowledgeStates, bktEngine);
    }

    // 전체 통계 계산
    const totalComponents = knowledgeStates.length;
    const masteredComponents = knowledgeStates.filter(ks => ks.pKnown >= 0.95).length;
    const avgKnowledge = totalComponents > 0
      ? knowledgeStates.reduce((sum, ks) => sum + ks.pKnown, 0) / totalComponents
      : 0;
    const needReviewCount = knowledgeStates.filter(ks => {
      const bkt = new BKTEngine();
      return bkt.needsReview(ks.pKnown, new Date(ks.lastUpdated));
    }).length;

    return NextResponse.json({
      knowledgeStates,
      recommendations,
      stats: {
        total: totalComponents,
        mastered: masteredComponents,
        avgKnowledge: Math.round(avgKnowledge * 100),
        needReview: needReviewCount,
      },
    });
  } catch (error) {
    console.error('Knowledge state error:', error);
    return NextResponse.json(
      { error: '지식 상태를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 지식 상태 업데이트 (문제 풀이 결과)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { componentId, componentName, courseId, isCorrect, difficulty = 'medium' } = body;

    if (!componentName || !courseId) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 기존 지식 컴포넌트 조회 또는 생성
    let knowledgeComponent = await prisma.knowledgeComponent.findFirst({
      where: {
        userId: session.user.id,
        name: componentName,
        courseId,
      },
    });

    // BKT 엔진 설정
    const params = DIFFICULTY_PARAMS[difficulty] || DEFAULT_BKT_PARAMS;
    const bktEngine = new BKTEngine(params);

    if (!knowledgeComponent) {
      // 새로운 지식 컴포넌트 생성
      const initialPKnown = params.pInit;
      const updatedPKnown = bktEngine.updateKnowledge(initialPKnown, isCorrect);

      knowledgeComponent = await prisma.knowledgeComponent.create({
        data: {
          userId: session.user.id,
          courseId,
          name: componentName,
          pKnown: updatedPKnown,
          pLearn: params.pLearn,
          pGuess: params.pGuess,
          pSlip: params.pSlip,
          attempts: 1,
          correctAttempts: isCorrect ? 1 : 0,
          lastAttempt: new Date(),
        },
      });
    } else {
      // 기존 지식 컴포넌트 업데이트
      const updatedPKnown = bktEngine.updateKnowledge(knowledgeComponent.pKnown, isCorrect);

      knowledgeComponent = await prisma.knowledgeComponent.update({
        where: { id: knowledgeComponent.id },
        data: {
          pKnown: updatedPKnown,
          attempts: { increment: 1 },
          correctAttempts: isCorrect ? { increment: 1 } : undefined,
          lastAttempt: new Date(),
        },
      });
    }

    // 예측 및 추천 정보
    const predictedCorrect = bktEngine.predictCorrect(knowledgeComponent.pKnown);
    const recommendedDifficulty = bktEngine.recommendDifficulty(knowledgeComponent.pKnown);
    const isMastered = bktEngine.isMastered(knowledgeComponent.pKnown);

    return NextResponse.json({
      knowledgeComponent: {
        id: knowledgeComponent.id,
        name: knowledgeComponent.name,
        pKnown: knowledgeComponent.pKnown,
        attempts: knowledgeComponent.attempts,
        correctAttempts: knowledgeComponent.correctAttempts,
      },
      predictions: {
        predictedCorrect: Math.round(predictedCorrect * 100),
        recommendedDifficulty,
        isMastered,
        knowledgeLevel: Math.round(knowledgeComponent.pKnown * 100),
      },
    });
  } catch (error) {
    console.error('Knowledge update error:', error);
    return NextResponse.json(
      { error: '지식 상태 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}
