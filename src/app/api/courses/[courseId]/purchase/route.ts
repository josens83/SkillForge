import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createPaymentIntent } from '@/lib/stripe';
import prisma from '@/lib/prisma';

// 코스 구매 의향 생성
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 코스 조회
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { error: '코스를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (course.accessType !== 'PURCHASE' || !course.price) {
      return NextResponse.json(
        { error: '이 코스는 구매가 필요하지 않습니다.' },
        { status: 400 }
      );
    }

    // 이미 구매했는지 확인
    const existingPayment = await prisma.payment.findFirst({
      where: {
        userId: session.user.id,
        courseId,
        status: 'SUCCEEDED',
      },
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: '이미 구매한 코스입니다.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { couponCode } = body;

    let finalPrice = course.price;
    let appliedCoupon = null;

    // 쿠폰 적용
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });

      if (coupon) {
        const now = new Date();
        if (
          coupon.validFrom <= now &&
          coupon.validUntil >= now &&
          (coupon.maxUses === 0 || coupon.currentUses < coupon.maxUses) &&
          (coupon.applicableCourses.length === 0 || coupon.applicableCourses.includes(courseId))
        ) {
          if (coupon.discountType === 'PERCENTAGE') {
            finalPrice = Math.round(course.price * (1 - coupon.discountValue / 100));
          } else {
            finalPrice = Math.max(0, course.price - coupon.discountValue);
          }
          appliedCoupon = coupon;
        }
      }
    }

    // Pro 회원 할인 적용
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (subscription?.status === 'ACTIVE' && ['pro', 'pro_plus'].includes(subscription.planId)) {
      finalPrice = Math.round(finalPrice * 0.5); // 50% 할인
    }

    // Stripe Customer ID 조회 또는 생성
    let customerId = subscription?.stripeCustomerId;

    // Payment Intent 생성
    const paymentIntent = await createPaymentIntent({
      amount: finalPrice,
      currency: 'krw',
      customerId: customerId || undefined,
      metadata: {
        userId: session.user.id,
        courseId,
        couponId: appliedCoupon?.id || '',
      },
    });

    // Payment 레코드 생성
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        courseId,
        amount: finalPrice,
        status: 'PENDING',
        type: 'COURSE',
        description: `코스 구매: ${course.title}`,
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    // 쿠폰 사용 횟수 증가
    if (appliedCoupon) {
      await prisma.coupon.update({
        where: { id: appliedCoupon.id },
        data: { currentUses: { increment: 1 } },
      });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: finalPrice,
      originalAmount: course.price,
      discount: course.price - finalPrice,
    });
  } catch (error) {
    console.error('Course purchase error:', error);
    return NextResponse.json(
      { error: '결제 준비에 실패했습니다.' },
      { status: 500 }
    );
  }
}
