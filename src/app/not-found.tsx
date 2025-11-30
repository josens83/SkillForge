import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Search, HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="py-12">
          <div className="mb-6">
            <span className="text-8xl">🔍</span>
          </div>

          <h1 className="text-4xl font-bold mb-2">404</h1>
          <h2 className="text-xl font-semibold mb-4">페이지를 찾을 수 없습니다</h2>

          <p className="text-muted-foreground mb-8">
            요청하신 페이지가 존재하지 않거나,
            <br />
            이동되었을 수 있습니다.
          </p>

          <div className="space-y-3">
            <Link href="/">
              <Button className="w-full">
                <Home className="h-4 w-4 mr-2" />
                홈으로 돌아가기
              </Button>
            </Link>

            <Link href="/courses">
              <Button variant="outline" className="w-full">
                <Search className="h-4 w-4 mr-2" />
                코스 둘러보기
              </Button>
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              도움이 필요하신가요?
            </p>
            <Link
              href="mailto:support@skillforge.io"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              고객 지원 문의하기
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
