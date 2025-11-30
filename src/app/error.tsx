'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 로깅 서비스로 전송 (예: Sentry)
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="py-12">
          <div className="mb-6">
            <div className="h-16 w-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-2">문제가 발생했습니다</h1>

          <p className="text-muted-foreground mb-6">
            페이지를 로드하는 중 오류가 발생했습니다.
            <br />
            잠시 후 다시 시도해주세요.
          </p>

          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="mb-6 p-4 bg-muted rounded-lg text-left">
              <p className="text-xs font-mono text-red-600 break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              다시 시도
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/'}
            >
              <Home className="h-4 w-4 mr-2" />
              홈으로 돌아가기
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            문제가 계속되면{' '}
            <a
              href="mailto:support@skillforge.io"
              className="text-primary hover:underline"
            >
              고객 지원
            </a>
            에 문의해주세요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
