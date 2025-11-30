import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { INITIAL_SKILLS } from '@/types/skill';

const features = [
  {
    title: 'AI 1:1 튜터링',
    description: 'Claude 기반 AI 튜터와 자연스러운 대화로 학습하세요.',
    icon: '🤖',
  },
  {
    title: '음성 대화 학습',
    description: '실시간 음성 대화로 스피킹 실력을 향상시키세요.',
    icon: '🎙️',
  },
  {
    title: '코딩 실습 환경',
    description: '브라우저에서 바로 코드를 작성하고 실행하세요.',
    icon: '💻',
  },
  {
    title: '적응형 학습',
    description: 'AI가 당신의 학습 패턴을 분석해 최적의 경로를 제안합니다.',
    icon: '📈',
  },
  {
    title: '자격증 대비',
    description: 'SQLD, 정보처리기사 등 자격증 시험을 완벽 대비하세요.',
    icon: '📜',
  },
  {
    title: '학습 분석',
    description: '상세한 학습 분석과 AI 인사이트로 성장을 확인하세요.',
    icon: '📊',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🔥</span>
            <span className="font-bold text-xl">SkillForge</span>
          </Link>
          <nav className="ml-auto flex items-center space-x-4">
            <Link href="/courses" className="text-sm font-medium hover:text-primary">
              코스
            </Link>
            <Link href="/pricing" className="text-sm font-medium hover:text-primary">
              요금제
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" size="sm">로그인</Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="sm">무료로 시작하기</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 gradient-primary text-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                AI와 함께하는 1:1 맞춤 스킬 마스터리
              </h1>
              <p className="mx-auto max-w-[700px] text-lg md:text-xl text-white/80">
                코딩, 비즈니스, 언어, 자격증 등 다양한 스킬을 AI 튜터와 함께 학습하세요.
                당신만을 위한 맞춤형 학습 경험을 제공합니다.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link href="/auth/signin">
                  <Button size="lg" variant="secondary" className="text-primary font-semibold">
                    무료로 시작하기
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    코스 둘러보기
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-white/60 mt-4">
                신용카드 없이 무료로 시작 • 하루 3개 레슨 무료
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter">왜 SkillForge인가요?</h2>
              <p className="text-muted-foreground mt-2">
                기존 학습 플랫폼과는 다른 혁신적인 학습 경험
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="text-4xl mb-2">{feature.icon}</div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Skills Section */}
        <section className="py-20 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter">학습 가능한 스킬</h2>
              <p className="text-muted-foreground mt-2">
                다양한 분야의 스킬을 AI 튜터와 함께 마스터하세요
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {INITIAL_SKILLS.map((skill) => (
                <Link key={skill.id} href={`/courses?category=${skill.category}`}>
                  <Card className="hover:shadow-md hover:border-primary transition-all cursor-pointer h-full">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className="text-3xl mb-2">{skill.icon}</div>
                      <p className="font-medium text-sm">{skill.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        약 {skill.estimatedHours}시간
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing CTA Section */}
        <section className="py-20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter">
                지금 바로 시작하세요
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground">
                무료로 시작하고, 필요할 때 업그레이드하세요.
                Pro 멤버십으로 모든 기능을 무제한으로 이용하세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Link href="/pricing">
                  <Button size="lg">요금제 보기</Button>
                </Link>
                <Link href="/auth/signin">
                  <Button size="lg" variant="outline">무료 체험 시작</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🔥</span>
              <span className="font-bold">SkillForge</span>
            </div>
            <nav className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground">이용약관</Link>
              <Link href="/privacy" className="hover:text-foreground">개인정보처리방침</Link>
              <Link href="/contact" className="hover:text-foreground">문의하기</Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              © 2024 SkillForge. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
