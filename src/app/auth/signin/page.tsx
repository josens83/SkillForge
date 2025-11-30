'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const handleOAuthSignIn = async (provider: string) => {
    setLoading(provider);
    await signIn(provider, { callbackUrl });
  };

  const handleDevSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading('credentials');
    await signIn('credentials', { email, callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-3xl">🔥</span>
            <span className="font-bold text-2xl">SkillForge</span>
          </Link>
          <CardTitle>로그인</CardTitle>
          <CardDescription>
            계정에 로그인하고 학습을 계속하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* OAuth Buttons */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleOAuthSignIn('google')}
            disabled={loading !== null}
          >
            {loading === 'google' ? (
              '처리 중...'
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google로 계속하기
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-black border-[#FEE500]"
            onClick={() => handleOAuthSignIn('kakao')}
            disabled={loading !== null}
          >
            {loading === 'kakao' ? (
              '처리 중...'
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.86 5.25 4.64 6.66-.2.74-.74 2.69-.85 3.11-.13.54.2.53.41.39.17-.12 2.69-1.82 3.77-2.56.66.09 1.34.14 2.03.14 5.52 0 10-3.58 10-8s-4.48-8-10-8z"
                  />
                </svg>
                카카오로 계속하기
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">또는</span>
            </div>
          </div>

          {/* Dev Login (개발 환경에서만 표시) */}
          {process.env.NODE_ENV === 'development' && (
            <form onSubmit={handleDevSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">개발용 이메일 로그인</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="test@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading !== null || !email}
              >
                {loading === 'credentials' ? '처리 중...' : '이메일로 로그인'}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground">
            로그인하면 SkillForge의{' '}
            <Link href="/terms" className="text-primary hover:underline">
              이용약관
            </Link>
            과{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              개인정보처리방침
            </Link>
            에 동의하게 됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
