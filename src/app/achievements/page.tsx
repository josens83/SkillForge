'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, Lock } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  xpReward: number;
  earned: boolean;
  earnedAt?: Date;
}

async function fetchAchievements() {
  const response = await fetch('/api/achievements');
  return response.json();
}

const rarityColors: Record<string, string> = {
  common: 'border-gray-300 bg-gray-50',
  rare: 'border-blue-300 bg-blue-50',
  epic: 'border-purple-300 bg-purple-50',
  legendary: 'border-yellow-300 bg-yellow-50',
};

const rarityLabels: Record<string, string> = {
  common: '일반',
  rare: '레어',
  epic: '에픽',
  legendary: '전설',
};

export default function AchievementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: fetchAchievements,
  });

  const achievements: Achievement[] = data?.achievements || [];
  const stats = data?.stats || { total: 0, earned: 0, totalXpFromAchievements: 0 };

  const progressPercent = stats.total > 0 ? (stats.earned / stats.total) * 100 : 0;

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

      <main className="container py-8 max-w-4xl">
        <div className="text-center mb-8">
          <Award className="h-12 w-12 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold">성취</h1>
          <p className="text-muted-foreground">학습 여정에서 얻은 배지들</p>
        </div>

        {/* Stats */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div>
                <p className="text-3xl font-bold">{stats.earned}</p>
                <p className="text-sm text-muted-foreground">획득한 배지</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">전체 배지</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.totalXpFromAchievements}</p>
                <p className="text-sm text-muted-foreground">획득 XP</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>진행률</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} />
            </div>
          </CardContent>
        </Card>

        {/* Achievements Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="py-6">
                  <div className="h-12 w-12 bg-muted rounded-full mx-auto mb-3" />
                  <div className="h-4 bg-muted rounded mx-auto w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {achievements.map((achievement) => (
              <Card
                key={achievement.id}
                className={`relative transition-all ${
                  achievement.earned
                    ? rarityColors[achievement.rarity]
                    : 'opacity-60 grayscale'
                }`}
              >
                <CardContent className="py-6 text-center">
                  <div className="text-4xl mb-3">{achievement.icon}</div>
                  <h3 className="font-semibold mb-1">{achievement.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {achievement.description}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      achievement.rarity === 'legendary' ? 'bg-yellow-200 text-yellow-800' :
                      achievement.rarity === 'epic' ? 'bg-purple-200 text-purple-800' :
                      achievement.rarity === 'rare' ? 'bg-blue-200 text-blue-800' :
                      'bg-gray-200 text-gray-800'
                    }`}>
                      {rarityLabels[achievement.rarity]}
                    </span>
                    <span className="text-xs text-primary font-medium">
                      +{achievement.xpReward} XP
                    </span>
                  </div>

                  {!achievement.earned && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
                      <Lock className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  {achievement.earned && achievement.earnedAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(achievement.earnedAt).toLocaleDateString('ko-KR')} 획득
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
