import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import prisma from '@/lib/prisma';
import { formatDuration, getInitials } from '@/lib/utils';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // 사용자 데이터 가져오기
  const [learnerProfile, enrollments, streak] = await Promise.all([
    prisma.learnerProfile.findUnique({
      where: { userId: session.user.id },
    }),
    prisma.courseEnrollment.findMany({
      where: { userId: session.user.id },
      include: {
        course: {
          include: { skill: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    prisma.studyStreak.findFirst({
      where: { userId: session.user.id },
      orderBy: { date: 'desc' },
    }),
  ]);

  const totalXp = learnerProfile?.totalXp || 0;
  const currentLevel = learnerProfile?.currentLevel || 1;

  // 이번 주 스트릭 계산
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  const weekStreaks = await prisma.studyStreak.findMany({
    where: {
      userId: session.user.id,
      date: { gte: weekStart },
    },
  });

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const streakDays = weekDays.map((_, index) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + index);
    return weekStreaks.some(s => {
      const streakDate = new Date(s.date);
      return streakDate.toDateString() === dayDate.toDateString();
    });
  });

  // 연속 학습일 계산
  let currentStreak = 0;
  const sortedStreaks = await prisma.studyStreak.findMany({
    where: { userId: session.user.id },
    orderBy: { date: 'desc' },
    take: 30,
  });

  for (let i = 0; i < sortedStreaks.length; i++) {
    const streakDate = new Date(sortedStreaks[i].date);
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);
    streakDate.setHours(0, 0, 0, 0);

    if (streakDate.getTime() === expectedDate.getTime()) {
      currentStreak++;
    } else {
      break;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🔥</span>
            <span className="font-bold text-xl">SkillForge</span>
          </Link>
          <nav className="ml-auto flex items-center space-x-4">
            <Link href="/courses" className="text-sm font-medium hover:text-primary">
              코스
            </Link>
            <Link href="/dashboard/settings" className="text-sm font-medium hover:text-primary">
              설정
            </Link>
            <Avatar>
              <AvatarImage src={session.user.image || ''} />
              <AvatarFallback>{getInitials(session.user.name || 'U')}</AvatarFallback>
            </Avatar>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">안녕하세요, {session.user.name}님!</h1>
          <p className="text-muted-foreground">오늘도 함께 성장해요</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* XP & Level Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>현재 레벨</CardDescription>
              <CardTitle className="text-4xl">Lv.{currentLevel}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-2">
                총 {totalXp.toLocaleString()} XP
              </div>
              <Progress value={(totalXp % 1000) / 10} />
            </CardContent>
          </Card>

          {/* Streak Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>연속 학습</CardDescription>
              <CardTitle className="text-4xl">{currentStreak}일</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mt-2">
                {weekDays.map((day, index) => (
                  <div
                    key={day}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      streakDays[index]
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Today's Goal */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>오늘의 목표</CardDescription>
              <CardTitle className="text-4xl">0/3</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={0} />
              <p className="text-sm text-muted-foreground mt-2">레슨 완료</p>
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>구독 상태</CardDescription>
              <CardTitle className="text-2xl capitalize">
                {session.user.subscription?.planId || 'Free'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {session.user.subscription?.planId === 'free' ? (
                <Link href="/pricing">
                  <Button size="sm" className="w-full">Pro로 업그레이드</Button>
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground">
                  모든 기능 사용 가능
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Courses */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">학습 중인 코스</h2>
            <Link href="/courses">
              <Button variant="outline" size="sm">전체 보기</Button>
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">아직 수강 중인 코스가 없습니다.</p>
                <Link href="/courses">
                  <Button>코스 둘러보기</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {enrollments.map((enrollment) => (
                <Link key={enrollment.id} href={`/courses/${enrollment.courseId}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{enrollment.course.skill.icon}</span>
                        <div>
                          <CardTitle className="text-lg">{enrollment.course.title}</CardTitle>
                          <CardDescription>{enrollment.course.skill.name}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>진도율</span>
                          <span>{Math.round(enrollment.progress)}%</span>
                        </div>
                        <Progress value={enrollment.progress} />
                        <p className="text-xs text-muted-foreground">
                          총 {formatDuration(enrollment.course.totalDuration)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="mt-8">
          <h2 className="text-2xl font-bold mb-4">빠른 시작</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="text-4xl">🤖</div>
                <div>
                  <h3 className="font-semibold">AI 튜터와 대화</h3>
                  <p className="text-sm text-muted-foreground">궁금한 것을 물어보세요</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="text-4xl">💻</div>
                <div>
                  <h3 className="font-semibold">코딩 연습</h3>
                  <p className="text-sm text-muted-foreground">실습 문제 풀기</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="text-4xl">📝</div>
                <div>
                  <h3 className="font-semibold">퀴즈 도전</h3>
                  <p className="text-sm text-muted-foreground">실력 테스트하기</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
