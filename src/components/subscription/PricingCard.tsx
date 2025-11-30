'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionPlan, formatPrice, calculateYearlyDiscount } from '@/types/subscription';
import { Check, X, Loader2 } from 'lucide-react';

interface PricingCardProps {
  plan: SubscriptionPlan;
  billingCycle: 'monthly' | 'yearly';
  isCurrentPlan?: boolean;
}

export function PricingCard({ plan, billingCycle, isCurrentPlan }: PricingCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  const monthlyPrice = billingCycle === 'yearly' ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;
  const discount = calculateYearlyDiscount(plan);

  const handleSubscribe = async () => {
    if (!session) {
      router.push('/auth/signin?callbackUrl=/pricing');
      return;
    }

    if (plan.id === 'free') {
      router.push('/dashboard');
      return;
    }

    if (plan.id === 'enterprise') {
      router.push('/contact');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, billingCycle }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || '결제 페이지로 이동할 수 없습니다.');
      }
    } catch (error) {
      alert('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`relative flex flex-col ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
            가장 인기
          </span>
        </div>
      )}

      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="mb-6">
          {plan.id === 'enterprise' ? (
            <span className="text-3xl font-bold">문의</span>
          ) : price === 0 ? (
            <span className="text-3xl font-bold">무료</span>
          ) : (
            <div>
              <span className="text-3xl font-bold">{formatPrice(monthlyPrice)}</span>
              <span className="text-muted-foreground">/월</span>
              {billingCycle === 'yearly' && discount > 0 && (
                <p className="text-sm text-green-600 mt-1">
                  연 {formatPrice(price)} ({discount}% 할인)
                </p>
              )}
            </div>
          )}
        </div>

        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
          {plan.limitations?.map((limitation, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <span>{limitation}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={plan.popular ? 'default' : 'outline'}
          disabled={loading || isCurrentPlan}
          onClick={handleSubscribe}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              처리 중...
            </>
          ) : isCurrentPlan ? (
            '현재 플랜'
          ) : plan.id === 'free' ? (
            '무료로 시작'
          ) : plan.id === 'enterprise' ? (
            '문의하기'
          ) : (
            '시작하기'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
