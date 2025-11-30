import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
    // 개발용 Credentials Provider
    ...(process.env.NODE_ENV === 'development'
      ? [
          CredentialsProvider({
            name: 'Development',
            credentials: {
              email: { label: 'Email', type: 'email' },
            },
            async authorize(credentials) {
              if (!credentials?.email) return null;

              // 개발 환경에서만 사용
              let user = await prisma.user.findUnique({
                where: { email: credentials.email },
              });

              if (!user) {
                user = await prisma.user.create({
                  data: {
                    email: credentials.email,
                    name: credentials.email.split('@')[0],
                  },
                });
              }

              return user;
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async session({ session, token, user }) {
      if (session.user) {
        session.user.id = token?.sub || user?.id;

        // 구독 정보 추가
        const subscription = await prisma.subscription.findUnique({
          where: { userId: session.user.id },
        });

        session.user.subscription = subscription
          ? {
              planId: subscription.planId,
              status: subscription.status,
              currentPeriodEnd: subscription.currentPeriodEnd,
            }
          : {
              planId: 'free',
              status: 'ACTIVE',
              currentPeriodEnd: null,
            };
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
};

// 타입 확장
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      subscription?: {
        planId: string;
        status: string;
        currentPeriodEnd: Date | null;
      };
    };
  }
}
