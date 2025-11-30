import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Stripe 가격 ID 매핑
export const STRIPE_PRICE_IDS = {
  pro_monthly: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
  pro_yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
  pro_plus_monthly: process.env.STRIPE_PRO_PLUS_PRICE_ID || 'price_pro_plus_monthly',
  pro_plus_yearly: process.env.STRIPE_PRO_PLUS_YEARLY_PRICE_ID || 'price_pro_plus_yearly',
};

// 플랜과 가격 ID 매핑
export function getPriceId(planId: string, billingCycle: 'monthly' | 'yearly'): string | null {
  const key = `${planId}_${billingCycle}` as keyof typeof STRIPE_PRICE_IDS;
  return STRIPE_PRICE_IDS[key] || null;
}

// Checkout 세션 생성
export async function createCheckoutSession({
  userId,
  email,
  priceId,
  successUrl,
  cancelUrl,
  couponId,
}: {
  userId: string;
  email: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  couponId?: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer_email: email,
    client_reference_id: userId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
    ...(couponId && {
      discounts: [{ coupon: couponId }],
    }),
    allow_promotion_codes: !couponId,
  });

  return session;
}

// Customer Portal 세션 생성
export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

// 구독 취소
export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

// 구독 재개
export async function resumeSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

// 단건 결제 (코스 구매)
export async function createPaymentIntent({
  amount,
  currency = 'krw',
  customerId,
  metadata,
}: {
  amount: number;
  currency?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}) {
  return await stripe.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });
}

// 쿠폰 검증
export async function validateCoupon(couponCode: string) {
  try {
    const promotionCodes = await stripe.promotionCodes.list({
      code: couponCode,
      active: true,
    });

    if (promotionCodes.data.length === 0) {
      return { valid: false, error: '유효하지 않은 쿠폰입니다.' };
    }

    const promotionCode = promotionCodes.data[0];
    const coupon = promotionCode.coupon;

    return {
      valid: true,
      promotionCodeId: promotionCode.id,
      coupon: {
        id: coupon.id,
        percentOff: coupon.percent_off,
        amountOff: coupon.amount_off,
        duration: coupon.duration,
        durationInMonths: coupon.duration_in_months,
      },
    };
  } catch (error) {
    return { valid: false, error: '쿠폰 검증 중 오류가 발생했습니다.' };
  }
}

// Webhook 이벤트 처리
export async function constructWebhookEvent(
  body: string | Buffer,
  signature: string
) {
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}
