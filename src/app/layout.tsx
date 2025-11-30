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
      <head>
        {/* PWA 관련 메타 태그 */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SkillForge" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-TileColor" content="#f97316" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
        {/* Service Worker 등록 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful');
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
