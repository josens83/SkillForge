'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="py-12">
          <div className="mb-6">
            <WifiOff className="h-16 w-16 mx-auto text-muted-foreground" />
          </div>

          <h1 className="text-2xl font-bold mb-2">오프라인 상태입니다</h1>

          <p className="text-muted-foreground mb-6">
            인터넷 연결이 끊어졌습니다.
            <br />
            연결 상태를 확인하고 다시 시도해주세요.
          </p>

          <div className="space-y-3">
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              다시 시도
            </Button>

            <p className="text-xs text-muted-foreground">
              일부 콘텐츠는 오프라인에서도 사용할 수 있습니다.
              <br />
              이전에 방문한 페이지는 캐시에서 로드됩니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
