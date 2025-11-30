'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SUBSCRIPTION_PLANS, formatPrice, calculateYearlyDiscount } from '@/types/subscription';
import { Check, X } from 'lucide-react';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    if (!session) {
      router.push('/auth/signin?callbackUrl=/pricing');
      return;
    }

    if (planId === 'free') {
      router.push('/dashboard');
      return;
    }

    if (planId === 'enterprise') {
      router.push('/contact');
      return;
    }

    setLoading(planId);

    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingCycle }),
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
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🔥</span>
            <span className="font-bold text-xl">SkillForge</span>
          </Link>
          <nav className="ml-auto flex items-center space-x-4">
            <Link href="/courses" className="text-sm font-medium hover:text-primary">
              코스
            </Link>
            {session ? (
              <Link href="/dashboard">
                <Button size="sm">대시보드</Button>
              </Link>
            ) : (
              <Link href="/auth/signin">
                <Button size="sm">로그인</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="container py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tighter mb-4">
            나에게 맞는 플랜을 선택하세요
          </h1>
          <p className="text-muted-foreground max-w-[600px] mx-auto">
            무료로 시작하고, 필요에 따라 업그레이드하세요.
            연간 결제시 최대 33% 할인됩니다.
          </p>

          <div className="flex justify-center mt-8">
            <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as 'monthly' | 'yearly')}>
              <TabsList>
                <TabsTrigger value="monthly">월간 결제</TabsTrigger>
                <TabsTrigger value="yearly">
                  연간 결제
                  <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                    33% 할인
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
            const monthlyPrice = billingCycle === 'yearly' ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;
            const discount = calculateYearlyDiscount(plan);
            const isCurrentPlan = session?.user?.subscription?.planId === plan.id;

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
              >
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
                      <div>
                        <span className="text-3xl font-bold">문의</span>
                      </div>
                    ) : price === 0 ? (
                      <div>
                        <span className="text-3xl font-bold">무료</span>
                      </div>
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
                    disabled={loading === plan.id || isCurrentPlan}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    {loading === plan.id
                      ? '처리 중...'
                      : isCurrentPlan
                      ? '현재 플랜'
                      : plan.id === 'free'
                      ? '무료로 시작'
                      : plan.id === 'enterprise'
                      ? '문의하기'
                      : '시작하기'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <section className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">자주 묻는 질문</h2>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold">무료 플랜으로 무엇을 할 수 있나요?</h3>
              <p className="text-muted-foreground mt-2">
                무료 플랜에서는 하루 3개의 레슨, 텍스트 기반 AI 튜터, 기본 진도 트래킹을 이용할 수 있습니다.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold">언제든지 해지할 수 있나요?</h3>
              <p className="text-muted-foreground mt-2">
                네, 언제든지 해지할 수 있습니다. 해지 후에도 결제 기간이 끝날 때까지 서비스를 이용할 수 있습니다.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold">플랜을 변경할 수 있나요?</h3>
              <p className="text-muted-foreground mt-2">
                네, 언제든지 상위 플랜으로 업그레이드하거나 하위 플랜으로 다운그레이드할 수 있습니다.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold">환불 정책은 어떻게 되나요?</h3>
              <p className="text-muted-foreground mt-2">
                첫 구독 후 7일 이내에는 전액 환불이 가능합니다. 자세한 내용은 환불 정책을 확인해주세요.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
