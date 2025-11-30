import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateTutorResponse, getTutorById } from '@/lib/ai-tutor';
import prisma from '@/lib/prisma';
import { ConversationContext, Message, LearnerProfile } from '@/types/ai-tutor';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 구독 상태 확인 (Pro 이상만 AI 튜터 사용 가능)
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    const isPremium = subscription?.status === 'ACTIVE' &&
      ['pro', 'pro_plus', 'enterprise'].includes(subscription.planId);

    // 무료 사용자는 하루 3회 제한
    if (!isPremium) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayConversations = await prisma.conversation.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: today },
        },
      });

      if (todayConversations >= 3) {
        return NextResponse.json(
          { error: '무료 사용자는 하루 3회까지 AI 튜터를 사용할 수 있습니다. Pro로 업그레이드하세요.' },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { message, tutorId, lessonId, conversationId } = body;

    if (!message || !tutorId) {
      return NextResponse.json(
        { error: '메시지와 튜터 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const tutor = getTutorById(tutorId);
    if (!tutor) {
      return NextResponse.json(
        { error: '존재하지 않는 튜터입니다.' },
        { status: 404 }
      );
    }

    // 대화 컨텍스트 가져오기 또는 생성
    let conversation = conversationId
      ? await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { messages: { orderBy: { createdAt: 'asc' } } },
        })
      : null;

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: session.user.id,
          lessonId,
          tutorId,
        },
        include: { messages: true },
      });
    }

    // 학습자 프로필 가져오기
    let learnerProfile = await prisma.learnerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!learnerProfile) {
      learnerProfile = await prisma.learnerProfile.create({
        data: {
          userId: session.user.id,
          level: 'beginner',
          learningStyle: 'visual',
          pacePreference: 'normal',
          preferredLanguage: 'ko',
          weakAreas: [],
          strongAreas: [],
        },
      });
    }

    // 레슨 내용 가져오기
    let lessonContent = '';
    let currentTopic = '일반 대화';

    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
      });
      if (lesson) {
        lessonContent = JSON.stringify(lesson.content || {});
        currentTopic = lesson.title;
      }
    }

    // 대화 기록 변환
    const conversationHistory: Message[] = conversation.messages.map(m => ({
      id: m.id,
      role: m.role as 'user' | 'tutor' | 'system',
      content: m.content,
      timestamp: m.createdAt,
    }));

    // 컨텍스트 구성
    const context: ConversationContext = {
      lessonId: lessonId || '',
      lessonContent,
      learnerProfile: {
        id: learnerProfile.id,
        level: learnerProfile.level as 'beginner' | 'intermediate' | 'advanced',
        learningStyle: learnerProfile.learningStyle as 'visual' | 'auditory' | 'reading' | 'kinesthetic',
        pacePreference: learnerProfile.pacePreference as 'slow' | 'normal' | 'fast',
        weakAreas: learnerProfile.weakAreas,
        strongAreas: learnerProfile.strongAreas,
        preferredLanguage: learnerProfile.preferredLanguage as 'ko' | 'en' | 'mixed',
      },
      conversationHistory,
      currentTopic,
      learnerMistakes: [],
      sessionGoals: ['학습 내용 이해', '질문에 답변'],
    };

    // AI 응답 생성
    const response = await generateTutorResponse(context, tutor, message);

    // 사용자 메시지 저장
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    });

    // AI 응답 저장
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'tutor',
        content: response.message,
      },
    });

    // XP 지급 (대화 1회당 5XP)
    await prisma.learnerProfile.update({
      where: { userId: session.user.id },
      data: {
        totalXp: { increment: 5 },
      },
    });

    return NextResponse.json({
      conversationId: conversation.id,
      message: response.message,
      analysis: response.analysis,
      suggestedFollowUp: response.suggestedFollowUp,
    });
  } catch (error) {
    console.error('AI Tutor chat error:', error);
    return NextResponse.json(
      { error: 'AI 튜터 응답 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
