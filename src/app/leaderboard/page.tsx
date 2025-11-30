'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Trophy, Medal, Award, Crown } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  totalXp?: number;
  xpThisPeriod?: number;
  level?: number;
}

async function fetchLeaderboard(period: string) {
  const response = await fetch(`/api/leaderboard?period=${period}&limit=20`);
  return response.json();
}

const rankIcons: Record<number, React.ReactNode> = {
  1: <Crown className="h-6 w-6 text-yellow-500" />,
  2: <Medal className="h-6 w-6 text-gray-400" />,
  3: <Medal className="h-6 w-6 text-amber-600" />,
};

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [period, setPeriod] = useState('weekly');

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => fetchLeaderboard(period),
  });

  const leaderboard = period === 'alltime' ? data?.allTime : data?.[period];
  const currentUser = data?.currentUser;

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
            <Link href="/dashboard">
              <Button size="sm" variant="outline">대시보드</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container py-8 max-w-3xl">
        <div className="text-center mb-8">
          <Trophy className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h1 className="text-3xl font-bold">리더보드</h1>
          <p className="text-muted-foreground">SkillForge 학습 랭킹</p>
        </div>

        {/* Current User Rank */}
        {session && currentUser && (
          <Card className="mb-6 bg-primary/5 border-primary/20">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-primary">
                    #{currentUser.rank}
                  </div>
                  <Avatar>
                    <AvatarImage src={session.user.image || ''} />
                    <AvatarFallback>{getInitials(session.user.name || 'U')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{session.user.name} (나)</p>
                    <p className="text-sm text-muted-foreground">
                      Lv.{currentUser.level} • {currentUser.totalXp.toLocaleString()} XP
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Period Tabs */}
        <Tabs value={period} onValueChange={setPeriod} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly">이번 주</TabsTrigger>
            <TabsTrigger value="monthly">이번 달</TabsTrigger>
            <TabsTrigger value="alltime">전체</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {period === 'weekly' && '주간 랭킹'}
              {period === 'monthly' && '월간 랭킹'}
              {period === 'alltime' && '전체 랭킹'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-4 p-3">
                    <div className="w-8 h-8 bg-muted rounded" />
                    <div className="w-10 h-10 bg-muted rounded-full" />
                    <div className="flex-1 h-4 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : leaderboard?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                아직 데이터가 없습니다.
              </p>
            ) : (
              <div className="space-y-2">
                {leaderboard?.map((entry: LeaderboardEntry) => (
                  <div
                    key={entry.user.id}
                    className={`flex items-center gap-4 p-3 rounded-lg ${
                      entry.rank <= 3 ? 'bg-muted/50' : ''
                    } ${
                      entry.user.id === session?.user?.id ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className="w-8 flex justify-center">
                      {rankIcons[entry.rank] || (
                        <span className="text-lg font-bold text-muted-foreground">
                          {entry.rank}
                        </span>
                      )}
                    </div>
                    <Avatar>
                      <AvatarImage src={entry.user.image || ''} />
                      <AvatarFallback>
                        {getInitials(entry.user.name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">
                        {entry.user.name}
                        {entry.user.id === session?.user?.id && (
                          <span className="text-xs text-primary ml-2">(나)</span>
                        )}
                      </p>
                      {entry.level && (
                        <p className="text-xs text-muted-foreground">
                          Lv.{entry.level}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {(entry.totalXp || entry.xpThisPeriod || 0).toLocaleString()} XP
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
