import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 코스 상세 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const session = await getServerSession(authOptions);

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        skill: true,
        instructor: true,
        chapters: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                type: true,
                duration: true,
                order: true,
                aiTutorEnabled: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: '코스를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 사용자 수강 정보 조회
    let enrollment = null;
    let lessonProgress: Record<string, boolean> = {};

    if (session?.user?.id) {
      enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId,
          },
        },
      });

      // 레슨별 진도 조회
      const progress = await prisma.lessonProgress.findMany({
        where: {
          userId: session.user.id,
          lesson: {
            chapter: {
              courseId,
            },
          },
        },
        select: {
          lessonId: true,
          completed: true,
        },
      });

      lessonProgress = progress.reduce((acc, p) => {
        acc[p.lessonId] = p.completed;
        return acc;
      }, {} as Record<string, boolean>);
    }

    return NextResponse.json({
      course,
      enrollment,
      lessonProgress,
    });
  } catch (error) {
    console.error('Course fetch error:', error);
    return NextResponse.json(
      { error: '코스 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
