import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import prisma from '@/lib/prisma';
import { formatDate, formatPrice, getInitials } from '@/lib/utils';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';
import { ManageSubscriptionButton } from '@/components/subscription/ManageSubscriptionButton';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const [subscription, payments, profile] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userId: session.user.id },
    }),
    prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.learnerProfile.findUnique({
      where: { userId: session.user.id },
    }),
  ]);

  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === subscription?.planId) || SUBSCRIPTION_PLANS[0];

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
            <Link href="/dashboard" className="text-sm font-medium hover:text-primary">
              대시보드
            </Link>
            <Link href="/courses" className="text-sm font-medium hover:text-primary">
              코스
            </Link>
            <Avatar>
              <AvatarImage src={session.user.image || ''} />
              <AvatarFallback>{getInitials(session.user.name || 'U')}</AvatarFallback>
            </Avatar>
          </nav>
        </div>
      </header>

      <main className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">설정</h1>

        <div className="space-y-6">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle>프로필</CardTitle>
              <CardDescription>계정 정보를 관리합니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={session.user.image || ''} />
                  <AvatarFallback className="text-xl">
                    {getInitials(session.user.name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{session.user.name}</h3>
                  <p className="text-muted-foreground">{session.user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Section */}
          <Card>
            <CardHeader>
              <CardTitle>구독 관리</CardTitle>
              <CardDescription>현재 구독 플랜과 결제 정보</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <h3 className="font-semibold text-lg">{currentPlan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {subscription?.status === 'ACTIVE' ? (
                      <>
                        {subscription.billingCycle === 'YEARLY' ? '연간' : '월간'} 구독 •{' '}
                        {formatDate(subscription.currentPeriodEnd)}까지
                      </>
                    ) : (
                      '무료 플랜'
                    )}
                  </p>
                  {subscription?.cancelAtPeriodEnd && (
                    <p className="text-sm text-orange-600 mt-1">
                      구독이 {formatDate(subscription.currentPeriodEnd)}에 종료됩니다
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {currentPlan.monthlyPrice > 0 && (
                    <p className="font-semibold">
                      {formatPrice(
                        subscription?.billingCycle === 'YEARLY'
                          ? currentPlan.yearlyPrice
                          : currentPlan.monthlyPrice
                      )}
                      /{subscription?.billingCycle === 'YEARLY' ? '년' : '월'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {subscription?.stripeCustomerId ? (
                  <ManageSubscriptionButton />
                ) : (
                  <Link href="/pricing">
                    <Button>Pro로 업그레이드</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>결제 내역</CardTitle>
              <CardDescription>최근 결제 내역입니다</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  결제 내역이 없습니다
                </p>
              ) : (
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium">{payment.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(payment.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          payment.status === 'SUCCEEDED' ? 'text-green-600' :
                          payment.status === 'FAILED' ? 'text-red-600' :
                          payment.status === 'REFUNDED' ? 'text-orange-600' : ''
                        }`}>
                          {formatPrice(payment.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {payment.status === 'SUCCEEDED' && '완료'}
                          {payment.status === 'FAILED' && '실패'}
                          {payment.status === 'REFUNDED' && '환불됨'}
                          {payment.status === 'PENDING' && '처리중'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Learning Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>학습 설정</CardTitle>
              <CardDescription>학습 환경을 설정합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">학습 레벨</label>
                  <p className="text-muted-foreground capitalize">
                    {profile?.level === 'beginner' && '입문자'}
                    {profile?.level === 'intermediate' && '중급자'}
                    {profile?.level === 'advanced' && '고급자'}
                    {!profile?.level && '미설정'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">학습 스타일</label>
                  <p className="text-muted-foreground">
                    {profile?.learningStyle === 'visual' && '시각적'}
                    {profile?.learningStyle === 'auditory' && '청각적'}
                    {profile?.learningStyle === 'reading' && '독서형'}
                    {profile?.learningStyle === 'kinesthetic' && '실습형'}
                    {!profile?.learningStyle && '미설정'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">학습 속도</label>
                  <p className="text-muted-foreground">
                    {profile?.pacePreference === 'slow' && '천천히'}
                    {profile?.pacePreference === 'normal' && '보통'}
                    {profile?.pacePreference === 'fast' && '빠르게'}
                    {!profile?.pacePreference && '미설정'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">선호 언어</label>
                  <p className="text-muted-foreground">
                    {profile?.preferredLanguage === 'ko' && '한국어'}
                    {profile?.preferredLanguage === 'en' && '영어'}
                    {profile?.preferredLanguage === 'mixed' && '혼합'}
                    {!profile?.preferredLanguage && '한국어'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">위험 구역</CardTitle>
              <CardDescription>계정 삭제는 되돌릴 수 없습니다</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive">계정 삭제</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
