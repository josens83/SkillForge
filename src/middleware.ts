import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // 인증된 사용자만 접근 가능한 경로에 대한 추가 로직
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // 대시보드 관련 경로는 인증 필요
        if (path.startsWith('/dashboard')) {
          return !!token;
        }

        // 구독 성공 페이지는 인증 필요
        if (path.startsWith('/subscription')) {
          return !!token;
        }

        // 그 외는 모두 허용
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/subscription/:path*',
    '/learn/:path*',
  ],
};
