import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 레슨 상세 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const { courseId, lessonId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 레슨 조회
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        chapter: {
          include: {
            course: {
              include: { skill: true },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: '레슨을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 코스 접근 권한 확인
    const course = lesson.chapter.course;

    if (course.accessType === 'PREMIUM') {
      const subscription = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
      });

      if (!subscription || subscription.status !== 'ACTIVE' ||
          !['pro', 'pro_plus', 'enterprise'].includes(subscription.planId)) {
        return NextResponse.json(
          { error: '이 레슨은 Pro 회원 전용입니다.', requiresUpgrade: true },
          { status: 403 }
        );
      }
    }

    if (course.accessType === 'PURCHASE') {
      const payment = await prisma.payment.findFirst({
        where: {
          userId: session.user.id,
          courseId: course.id,
          status: 'SUCCEEDED',
        },
      });

      if (!payment) {
        return NextResponse.json(
          { error: '이 코스는 구매가 필요합니다.', requiresPurchase: true, price: course.price },
          { status: 403 }
        );
      }
    }

    // 진도 정보 조회
    let progress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId,
        },
      },
    });

    // 진도 정보가 없으면 생성
    if (!progress) {
      progress = await prisma.lessonProgress.create({
        data: {
          userId: session.user.id,
          lessonId,
        },
      });
    }

    // 이전/다음 레슨 찾기
    const allLessons = await prisma.lesson.findMany({
      where: {
        chapter: { courseId: course.id },
      },
      orderBy: [
        { chapter: { order: 'asc' } },
        { order: 'asc' },
      ],
      select: { id: true, title: true },
    });

    const currentIndex = allLessons.findIndex(l => l.id === lessonId);
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    return NextResponse.json({
      lesson,
      progress,
      navigation: {
        prev: prevLesson,
        next: nextLesson,
        current: currentIndex + 1,
        total: allLessons.length,
      },
    });
  } catch (error) {
    console.error('Lesson fetch error:', error);
    return NextResponse.json(
      { error: '레슨 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 레슨 진도 업데이트
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const { courseId, lessonId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { completed, score, timeSpent, lastPosition } = body;

    // 진도 업데이트
    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId,
        },
      },
      update: {
        completed: completed ?? undefined,
        score: score ?? undefined,
        timeSpent: timeSpent ? { increment: timeSpent } : undefined,
        lastPosition: lastPosition ?? undefined,
        completedAt: completed ? new Date() : undefined,
      },
      create: {
        userId: session.user.id,
        lessonId,
        completed: completed ?? false,
        score,
        timeSpent: timeSpent ?? 0,
        lastPosition,
        completedAt: completed ? new Date() : undefined,
      },
    });

    // 레슨 완료 시 XP 지급 및 코스 진도 업데이트
    if (completed) {
      // XP 지급 (레슨당 10XP)
      await prisma.learnerProfile.upsert({
        where: { userId: session.user.id },
        update: { totalXp: { increment: 10 } },
        create: {
          userId: session.user.id,
          totalXp: 10,
        },
      });

      // 오늘 스트릭 업데이트
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.studyStreak.upsert({
        where: {
          userId_date: {
            userId: session.user.id,
            date: today,
          },
        },
        update: {
          xpEarned: { increment: 10 },
        },
        create: {
          userId: session.user.id,
          date: today,
          xpEarned: 10,
        },
      });

      // 코스 진도 재계산
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { chapter: true },
      });

      if (lesson) {
        const totalLessons = await prisma.lesson.count({
          where: { chapter: { courseId } },
        });

        const completedLessons = await prisma.lessonProgress.count({
          where: {
            userId: session.user.id,
            completed: true,
            lesson: { chapter: { courseId } },
          },
        });

        const progressPercent = (completedLessons / totalLessons) * 100;

        await prisma.courseEnrollment.update({
          where: {
            userId_courseId: {
              userId: session.user.id,
              courseId,
            },
          },
          data: {
            progress: progressPercent,
            status: progressPercent >= 100 ? 'COMPLETED' : 'ACTIVE',
            completedAt: progressPercent >= 100 ? new Date() : undefined,
          },
        });
      }
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Progress update error:', error);
    return NextResponse.json(
      { error: '진도 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}
