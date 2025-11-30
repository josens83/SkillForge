import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDuration, formatPrice, getInitials } from '@/lib/utils';
import { EnrollButton } from '@/components/course/EnrollButton';
import {
  Clock,
  Users,
  Star,
  BookOpen,
  PlayCircle,
  FileText,
  MessageSquare,
  Code,
  Mic,
  CheckCircle2,
  Lock
} from 'lucide-react';

const lessonTypeIcons: Record<string, React.ReactNode> = {
  VIDEO: <PlayCircle className="h-4 w-4" />,
  ARTICLE: <FileText className="h-4 w-4" />,
  AI_CONVERSATION: <MessageSquare className="h-4 w-4" />,
  QUIZ: <BookOpen className="h-4 w-4" />,
  CODING_EXERCISE: <Code className="h-4 w-4" />,
  SPEAKING: <Mic className="h-4 w-4" />,
  PROJECT: <Code className="h-4 w-4" />,
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
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
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  // 사용자 수강 정보
  let enrollment = null;
  let lessonProgress: Record<string, boolean> = {};
  let hasAccess = course.accessType === 'FREE';

  if (session?.user?.id) {
    enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    });

    const progress = await prisma.lessonProgress.findMany({
      where: {
        userId: session.user.id,
        lesson: { chapter: { courseId } },
      },
    });

    lessonProgress = progress.reduce((acc, p) => {
      acc[p.lessonId] = p.completed;
      return acc;
    }, {} as Record<string, boolean>);

    // 접근 권한 확인
    if (course.accessType === 'PREMIUM') {
      const subscription = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
      });
      hasAccess = subscription?.status === 'ACTIVE' &&
        ['pro', 'pro_plus', 'enterprise'].includes(subscription.planId);
    } else if (course.accessType === 'PURCHASE') {
      const payment = await prisma.payment.findFirst({
        where: {
          userId: session.user.id,
          courseId,
          status: 'SUCCEEDED',
        },
      });
      hasAccess = !!payment;
    }
  }

  const totalLessons = course.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0);
  const completedLessons = Object.values(lessonProgress).filter(Boolean).length;

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
            <Link href="/dashboard">
              <Button size="sm" variant="outline">대시보드</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-muted/50 py-12">
        <div className="container">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-3xl">{course.skill.icon}</span>
                <span className="text-sm font-medium text-muted-foreground">
                  {course.skill.name}
                </span>
                <span className={`ml-2 px-2 py-0.5 text-xs rounded ${
                  course.skill.difficulty === 'BEGINNER' ? 'bg-green-100 text-green-700' :
                  course.skill.difficulty === 'INTERMEDIATE' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {course.skill.difficulty === 'BEGINNER' && '입문'}
                  {course.skill.difficulty === 'INTERMEDIATE' && '중급'}
                  {course.skill.difficulty === 'ADVANCED' && '고급'}
                  {course.skill.difficulty === 'EXPERT' && '전문가'}
                </span>
              </div>

              <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
              <p className="text-muted-foreground mb-6">{course.description}</p>

              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{course.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({course.ratingCount}개 평가)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{course.enrollments.toLocaleString()}명 수강</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDuration(course.totalDuration)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>{totalLessons}개 레슨</span>
                </div>
              </div>

              {course.instructor && (
                <div className="flex items-center gap-3 mt-6">
                  <Avatar>
                    <AvatarImage src={course.instructor.avatar || ''} />
                    <AvatarFallback>{getInitials(course.instructor.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{course.instructor.name}</p>
                    <p className="text-sm text-muted-foreground">강사</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <Card className="sticky top-20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      course.accessType === 'FREE' ? 'bg-green-100 text-green-700' :
                      course.accessType === 'PREMIUM' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {course.accessType === 'FREE' && '무료'}
                      {course.accessType === 'PREMIUM' && 'Pro 전용'}
                      {course.accessType === 'PURCHASE' && formatPrice(course.price || 0)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {enrollment ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>진도율</span>
                          <span>{Math.round(enrollment.progress)}%</span>
                        </div>
                        <Progress value={enrollment.progress} />
                        <p className="text-xs text-muted-foreground">
                          {completedLessons}/{totalLessons} 레슨 완료
                        </p>
                      </div>
                      <Link href={`/learn/${courseId}`}>
                        <Button className="w-full">학습 계속하기</Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <EnrollButton
                        courseId={courseId}
                        accessType={course.accessType}
                        price={course.price}
                        hasAccess={hasAccess}
                      />
                      {course.accessType === 'PREMIUM' && !hasAccess && (
                        <Link href="/pricing">
                          <Button variant="outline" className="w-full">
                            Pro 업그레이드
                          </Button>
                        </Link>
                      )}
                    </>
                  )}

                  <div className="pt-4 border-t space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      AI 튜터 지원
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      실습 문제 포함
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      완료 인증서 발급
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum Section */}
      <section className="py-12">
        <div className="container">
          <h2 className="text-2xl font-bold mb-6">커리큘럼</h2>
          <div className="space-y-4">
            {course.chapters.map((chapter, chapterIndex) => (
              <Card key={chapter.id}>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>
                      {chapterIndex + 1}. {chapter.title}
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {chapter.lessons.length}개 레슨
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2">
                    {chapter.lessons.map((lesson, lessonIndex) => {
                      const isCompleted = lessonProgress[lesson.id];
                      const canAccess = enrollment || (course.accessType === 'FREE' && lessonIndex < 2);

                      return (
                        <li key={lesson.id}>
                          {canAccess ? (
                            <Link
                              href={`/learn/${courseId}/${lesson.id}`}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                            >
                              <div className={`flex-shrink-0 ${isCompleted ? 'text-green-500' : 'text-muted-foreground'}`}>
                                {isCompleted ? (
                                  <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                  lessonTypeIcons[lesson.type] || <PlayCircle className="h-5 w-5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium truncate ${isCompleted ? 'text-muted-foreground' : ''}`}>
                                  {lesson.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {lesson.type === 'VIDEO' && '영상'}
                                  {lesson.type === 'ARTICLE' && '텍스트'}
                                  {lesson.type === 'AI_CONVERSATION' && 'AI 대화'}
                                  {lesson.type === 'QUIZ' && '퀴즈'}
                                  {lesson.type === 'CODING_EXERCISE' && '코딩 실습'}
                                  {lesson.type === 'SPEAKING' && '스피킹'}
                                  {lesson.type === 'PROJECT' && '프로젝트'}
                                  {' • '}
                                  {formatDuration(lesson.duration)}
                                </p>
                              </div>
                              {lesson.aiTutorEnabled && (
                                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                                  AI
                                </span>
                              )}
                            </Link>
                          ) : (
                            <div className="flex items-center gap-3 p-3 rounded-lg opacity-60">
                              <Lock className="h-5 w-5 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{lesson.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDuration(lesson.duration)}
                                </p>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
