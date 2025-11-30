import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
    const { code, courseId, planId } = body;

    if (!code) {
      return NextResponse.json(
        { valid: false, error: '쿠폰 코드를 입력해주세요.' },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json({
        valid: false,
        error: '존재하지 않는 쿠폰입니다.',
      });
    }

    const now = new Date();

    // 유효기간 확인
    if (coupon.validFrom > now) {
      return NextResponse.json({
        valid: false,
        error: '아직 사용할 수 없는 쿠폰입니다.',
      });
    }

    if (coupon.validUntil < now) {
      return NextResponse.json({
        valid: false,
        error: '만료된 쿠폰입니다.',
      });
    }

    // 사용 횟수 확인
    if (coupon.maxUses > 0 && coupon.currentUses >= coupon.maxUses) {
      return NextResponse.json({
        valid: false,
        error: '이미 최대 사용 횟수에 도달한 쿠폰입니다.',
      });
    }

    // 적용 가능한 코스/플랜 확인
    if (courseId && coupon.applicableCourses.length > 0) {
      if (!coupon.applicableCourses.includes(courseId)) {
        return NextResponse.json({
          valid: false,
          error: '이 코스에는 적용할 수 없는 쿠폰입니다.',
        });
      }
    }

    if (planId && coupon.applicablePlans.length > 0) {
      if (!coupon.applicablePlans.includes(planId)) {
        return NextResponse.json({
          valid: false,
          error: '이 플랜에는 적용할 수 없는 쿠폰입니다.',
        });
      }
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json(
      { valid: false, error: '쿠폰 검증에 실패했습니다.' },
      { status: 500 }
    );
  }
}
