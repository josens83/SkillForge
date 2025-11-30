import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SkillForge - AI 튜터 기반 스킬 학습 플랫폼',
  description: 'AI와 함께하는 1:1 맞춤 스킬 마스터리. 코딩, 비즈니스, 언어, 자격증 등 다양한 스킬을 AI 튜터와 함께 학습하세요.',
  keywords: ['AI 튜터', '온라인 학습', '코딩 교육', '영어 회화', '자격증', 'SQLD'],
  authors: [{ name: 'SkillForge Team' }],
  openGraph: {
    title: 'SkillForge - AI 튜터 기반 스킬 학습 플랫폼',
    description: 'AI와 함께하는 1:1 맞춤 스킬 마스터리',
    url: 'https://skillforge.io',
    siteName: 'SkillForge',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SkillForge - AI 튜터 기반 스킬 학습 플랫폼',
    description: 'AI와 함께하는 1:1 맞춤 스킬 마스터리',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
