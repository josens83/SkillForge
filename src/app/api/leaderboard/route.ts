import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'weekly'; // weekly, monthly, alltime
    const limit = parseInt(searchParams.get('limit') || '10');

    const session = await getServerSession(authOptions);

    let dateFilter = {};

    if (period === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { date: { gte: weekAgo } };
    } else if (period === 'monthly') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { date: { gte: monthAgo } };
    }

    // XP 기준 리더보드
    const leaderboard = await prisma.learnerProfile.findMany({
      orderBy: { totalXp: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // 현재 사용자 순위
    let currentUserRank = null;
    if (session?.user?.id) {
      const userProfile = await prisma.learnerProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (userProfile) {
        const rank = await prisma.learnerProfile.count({
          where: { totalXp: { gt: userProfile.totalXp } },
        });

        currentUserRank = {
          rank: rank + 1,
          totalXp: userProfile.totalXp,
          level: userProfile.currentLevel,
        };
      }
    }

    // 주간 XP 리더보드
    const weeklyXp = await prisma.studyStreak.groupBy({
      by: ['userId'],
      where: dateFilter,
      _sum: { xpEarned: true },
      orderBy: { _sum: { xpEarned: 'desc' } },
      take: limit,
    });

    const weeklyLeaders = await Promise.all(
      weeklyXp.map(async (entry, index) => {
        const user = await prisma.user.findUnique({
          where: { id: entry.userId },
          select: { id: true, name: true, image: true },
        });
        return {
          rank: index + 1,
          user,
          xpThisPeriod: entry._sum.xpEarned || 0,
        };
      })
    );

    return NextResponse.json({
      allTime: leaderboard.map((entry, index) => ({
        rank: index + 1,
        user: entry.user,
        totalXp: entry.totalXp,
        level: entry.currentLevel,
      })),
      [period]: weeklyLeaders,
      currentUser: currentUserRank,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: '리더보드를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
