import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 코스 목록 조회
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const accessType = searchParams.get('accessType');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '12');

    const where: any = {
      published: true,
    };

    if (category) {
      where.skill = { category };
    }

    if (difficulty) {
      where.skill = { ...where.skill, difficulty: difficulty.toUpperCase() };
    }

    if (accessType) {
      where.accessType = accessType.toUpperCase();
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          skill: true,
          instructor: true,
          _count: {
            select: { chapters: true },
          },
        },
        orderBy: { enrollments: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.course.count({ where }),
    ]);

    return NextResponse.json({
      items: courses,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Courses fetch error:', error);
    return NextResponse.json(
      { error: '코스 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 코스 등록 (수강 신청)
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
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: '코스 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 코스 존재 확인
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { error: '존재하지 않는 코스입니다.' },
        { status: 404 }
      );
    }

    // 이미 수강 중인지 확인
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: '이미 수강 중인 코스입니다.' },
        { status: 400 }
      );
    }

    // 접근 권한 확인
    if (course.accessType === 'PREMIUM') {
      const subscription = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
      });

      if (!subscription || subscription.status !== 'ACTIVE' ||
          !['pro', 'pro_plus', 'enterprise'].includes(subscription.planId)) {
        return NextResponse.json(
          { error: '이 코스는 Pro 회원 전용입니다.' },
          { status: 403 }
        );
      }
    }

    if (course.accessType === 'PURCHASE' && course.price) {
      // 구매 여부 확인
      const payment = await prisma.payment.findFirst({
        where: {
          userId: session.user.id,
          courseId,
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

    // 수강 등록
    const enrollment = await prisma.courseEnrollment.create({
      data: {
        userId: session.user.id,
        courseId,
      },
    });

    // 수강생 수 업데이트
    await prisma.course.update({
      where: { id: courseId },
      data: { enrollments: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      enrollment,
    });
  } catch (error) {
    console.error('Course enrollment error:', error);
    return NextResponse.json(
      { error: '수강 등록에 실패했습니다.' },
      { status: 500 }
    );
  }
}
