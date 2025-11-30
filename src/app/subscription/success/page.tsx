'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      router.push('/pricing');
      return;
    }

    // 결제 완료 후 잠시 대기 (웹훅 처리 시간)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [sessionId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">결제 확인 중...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">결제가 완료되었습니다!</CardTitle>
          <CardDescription>
            SkillForge Pro 멤버가 되신 것을 환영합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <h3 className="font-semibold mb-2">이제 이용 가능한 기능</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>모든 코스 무제한 접근</li>
              <li>AI 튜터 음성 대화</li>
              <li>무제한 코딩 실습</li>
              <li>상세 학습 분석</li>
              <li>AI 맞춤 학습 경로</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Link href="/dashboard">
              <Button className="w-full">대시보드로 이동</Button>
            </Link>
            <Link href="/courses">
              <Button variant="outline" className="w-full">코스 둘러보기</Button>
            </Link>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            결제 영수증이 이메일로 발송되었습니다.
            문의사항이 있으시면 help@skillforge.io로 연락주세요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
