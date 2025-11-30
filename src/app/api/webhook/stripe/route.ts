import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { constructWebhookEvent } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = await constructWebhookEvent(body, signature);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id || session.metadata?.userId;

  if (!userId) {
    console.error('No userId found in checkout session');
    return;
  }

  // 구독 정보 업데이트는 subscription.created 이벤트에서 처리
  console.log(`Checkout completed for user: ${userId}`);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('No userId found in subscription metadata');
    return;
  }

  const planId = getPlanIdFromPriceId(subscription.items.data[0]?.price.id);
  const billingCycle = subscription.items.data[0]?.price.recurring?.interval === 'year'
    ? 'YEARLY'
    : 'MONTHLY';

  await prisma.subscription.upsert({
    where: { userId },
    update: {
      planId,
      status: mapStripeStatus(subscription.status),
      billingCycle,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0]?.price.id,
    },
    create: {
      userId,
      planId,
      status: mapStripeStatus(subscription.status),
      billingCycle,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0]?.price.id,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('No userId found in subscription metadata');
    return;
  }

  await prisma.subscription.update({
    where: { userId },
    data: {
      status: 'CANCELED',
      cancelAtPeriodEnd: true,
    },
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription || !invoice.customer) return;

  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: invoice.customer as string },
  });

  if (!subscription) return;

  // 결제 내역 저장
  await prisma.payment.create({
    data: {
      userId: subscription.userId,
      amount: invoice.amount_paid,
      currency: invoice.currency.toUpperCase(),
      status: 'SUCCEEDED',
      type: 'SUBSCRIPTION',
      description: `구독 결제 - ${subscription.planId}`,
      stripeInvoiceId: invoice.id,
      receiptUrl: invoice.hosted_invoice_url || undefined,
    },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.customer) return;

  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: invoice.customer as string },
  });

  if (!subscription) return;

  await prisma.subscription.update({
    where: { userId: subscription.userId },
    data: { status: 'PAST_DUE' },
  });

  // 결제 실패 내역 저장
  await prisma.payment.create({
    data: {
      userId: subscription.userId,
      amount: invoice.amount_due,
      currency: invoice.currency.toUpperCase(),
      status: 'FAILED',
      type: 'SUBSCRIPTION',
      description: `구독 결제 실패 - ${subscription.planId}`,
      stripeInvoiceId: invoice.id,
    },
  });
}

function getPlanIdFromPriceId(priceId: string): string {
  // Price ID에서 플랜 ID 추출 (환경변수 설정에 따라)
  const priceMap: Record<string, string> = {
    [process.env.STRIPE_PRO_PRICE_ID || '']: 'pro',
    [process.env.STRIPE_PRO_YEARLY_PRICE_ID || '']: 'pro',
    [process.env.STRIPE_PRO_PLUS_PRICE_ID || '']: 'pro_plus',
    [process.env.STRIPE_PRO_PLUS_YEARLY_PRICE_ID || '']: 'pro_plus',
  };

  return priceMap[priceId] || 'pro';
}

function mapStripeStatus(status: Stripe.Subscription.Status) {
  const statusMap: Record<string, 'ACTIVE' | 'CANCELED' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'PAST_DUE' | 'TRIALING' | 'UNPAID'> = {
    active: 'ACTIVE',
    canceled: 'CANCELED',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'INCOMPLETE_EXPIRED',
    past_due: 'PAST_DUE',
    trialing: 'TRIALING',
    unpaid: 'UNPAID',
  };

  return statusMap[status] || 'ACTIVE';
}
