import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 사용자 성취 조회
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 모든 성취 조회
    const allAchievements = await prisma.achievement.findMany({
      orderBy: [
        { rarity: 'asc' },
        { name: 'asc' },
      ],
    });

    // 사용자가 획득한 성취
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: session.user.id },
      include: { achievement: true },
    });

    const earnedIds = new Set(userAchievements.map(ua => ua.achievementId));

    const achievements = allAchievements.map(achievement => ({
      ...achievement,
      earned: earnedIds.has(achievement.id),
      earnedAt: userAchievements.find(ua => ua.achievementId === achievement.id)?.earnedAt,
    }));

    // 통계
    const stats = {
      total: allAchievements.length,
      earned: userAchievements.length,
      totalXpFromAchievements: userAchievements.reduce(
        (sum, ua) => sum + ua.achievement.xpReward,
        0
      ),
    };

    return NextResponse.json({ achievements, stats });
  } catch (error) {
    console.error('Achievements error:', error);
    return NextResponse.json(
      { error: '성취를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 성취 확인 및 지급 (내부용)
export async function checkAndAwardAchievements(userId: string) {
  const profile = await prisma.learnerProfile.findUnique({
    where: { userId },
    include: {
      user: {
        include: {
          achievements: true,
          lessonProgress: true,
          courseEnrollments: true,
          streaks: true,
        },
      },
    },
  });

  if (!profile) return [];

  const earnedAchievementIds = new Set(
    profile.user.achievements.map(a => a.achievementId)
  );

  const allAchievements = await prisma.achievement.findMany();
  const newAchievements: string[] = [];

  for (const achievement of allAchievements) {
    if (earnedAchievementIds.has(achievement.id)) continue;

    const criteria = achievement.criteria as any;
    let earned = false;

    switch (criteria.type) {
      case 'lessons_completed': {
        const completedLessons = profile.user.lessonProgress.filter(lp => lp.completed).length;
        earned = completedLessons >= criteria.count;
        break;
      }
      case 'course_completed': {
        const completedCourses = profile.user.courseEnrollments.filter(
          ce => ce.status === 'COMPLETED'
        ).length;
        earned = completedCourses >= criteria.count;
        break;
      }
      case 'streak': {
        // 연속 학습일 계산
        const streaks = profile.user.streaks.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < streaks.length; i++) {
          const streakDate = new Date(streaks[i].date);
          streakDate.setHours(0, 0, 0, 0);

          const expectedDate = new Date(today);
          expectedDate.setDate(today.getDate() - i);

          if (streakDate.getTime() === expectedDate.getTime()) {
            currentStreak++;
          } else {
            break;
          }
        }

        earned = currentStreak >= criteria.days;
        break;
      }
      case 'quiz_perfect': {
        const perfectQuizzes = profile.user.lessonProgress.filter(
          lp => lp.score === 100
        ).length;
        earned = perfectQuizzes >= criteria.count;
        break;
      }
      case 'xp_total': {
        earned = profile.totalXp >= criteria.amount;
        break;
      }
    }

    if (earned) {
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
        },
      });

      // XP 보상 지급
      await prisma.learnerProfile.update({
        where: { userId },
        data: { totalXp: { increment: achievement.xpReward } },
      });

      newAchievements.push(achievement.id);
    }
  }

  return newAchievements;
}
