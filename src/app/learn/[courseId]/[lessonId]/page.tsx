'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { VideoLesson } from '@/components/lesson/VideoLesson';
import { ArticleLesson } from '@/components/lesson/ArticleLesson';
import { QuizLesson } from '@/components/lesson/QuizLesson';
import { AIConversationLesson } from '@/components/lesson/AIConversationLesson';
import { CodingLesson } from '@/components/lesson/CodingLesson';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface LessonData {
  lesson: {
    id: string;
    title: string;
    type: string;
    duration: number;
    content: any;
    aiTutorEnabled: boolean;
    chapter: {
      id: string;
      title: string;
      course: {
        id: string;
        title: string;
        skill: { icon: string; name: string };
      };
    };
  };
  progress: {
    completed: boolean;
    score: number | null;
    timeSpent: number;
    lastPosition: number | null;
  };
  navigation: {
    prev: { id: string; title: string } | null;
    next: { id: string; title: string } | null;
    current: number;
    total: number;
  };
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/learn/${courseId}/${lessonId}`);
      return;
    }

    fetchLesson();
  }, [session, status, courseId, lessonId]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`);
      const data = await response.json();

      if (!response.ok) {
        if (data.requiresUpgrade) {
          router.push('/pricing');
          return;
        }
        if (data.requiresPurchase) {
          router.push(`/courses/${courseId}/purchase`);
          return;
        }
        throw new Error(data.error);
      }

      setLessonData(data);
    } catch (err: any) {
      setError(err.message || '레슨을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (score?: number) => {
    if (!lessonData) return;

    setCompleting(true);
    try {
      await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed: true,
          score,
        }),
      });

      setLessonData({
        ...lessonData,
        progress: { ...lessonData.progress, completed: true, score: score ?? null },
      });

      // 다음 레슨으로 이동
      if (lessonData.navigation.next) {
        setTimeout(() => {
          router.push(`/learn/${courseId}/${lessonData.navigation.next!.id}`);
        }, 1000);
      }
    } catch (err) {
      console.error('Complete error:', err);
    } finally {
      setCompleting(false);
    }
  };

  const handleProgress = async (timeSpent: number, lastPosition?: number) => {
    await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeSpent, lastPosition }),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !lessonData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || '레슨을 찾을 수 없습니다.'}</p>
          <Link href={`/courses/${courseId}`}>
            <Button>코스로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { lesson, progress, navigation } = lessonData;

  const renderLessonContent = () => {
    switch (lesson.type) {
      case 'VIDEO':
        return (
          <VideoLesson
            content={lesson.content}
            lastPosition={progress.lastPosition}
            onProgress={handleProgress}
            onComplete={handleComplete}
          />
        );
      case 'ARTICLE':
        return (
          <ArticleLesson
            content={lesson.content}
            onComplete={handleComplete}
          />
        );
      case 'QUIZ':
        return (
          <QuizLesson
            content={lesson.content}
            onComplete={handleComplete}
          />
        );
      case 'AI_CONVERSATION':
        return (
          <AIConversationLesson
            lessonId={lesson.id}
            content={lesson.content}
            onComplete={handleComplete}
          />
        );
      case 'CODING_EXERCISE':
        return (
          <CodingLesson
            content={lesson.content}
            onComplete={handleComplete}
          />
        );
      default:
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground">이 레슨 유형은 아직 지원되지 않습니다.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <Link href={`/courses/${courseId}`} className="flex items-center gap-2 ml-2">
            <span className="text-xl">{lesson.chapter.course.skill.icon}</span>
            <span className="font-medium hidden sm:inline">{lesson.chapter.course.title}</span>
          </Link>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span>{navigation.current} / {navigation.total}</span>
            </div>
            <Progress
              value={(navigation.current / navigation.total) * 100}
              className="w-24 h-2"
            />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-6">
            {/* Lesson Header */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-1">
                {lesson.chapter.title}
              </p>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {lesson.title}
                {progress.completed && (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                )}
              </h1>
            </div>

            {/* Lesson Content */}
            <div className="mb-8">
              {renderLessonContent()}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t">
              {navigation.prev ? (
                <Link href={`/learn/${courseId}/${navigation.prev.id}`}>
                  <Button variant="outline">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    이전: {navigation.prev.title}
                  </Button>
                </Link>
              ) : (
                <div />
              )}

              {!progress.completed && lesson.type !== 'QUIZ' && lesson.type !== 'CODING_EXERCISE' && (
                <Button onClick={() => handleComplete()} disabled={completing}>
                  {completing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    '완료하기'
                  )}
                </Button>
              )}

              {navigation.next ? (
                <Link href={`/learn/${courseId}/${navigation.next.id}`}>
                  <Button>
                    다음: {navigation.next.title}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Link href={`/courses/${courseId}`}>
                  <Button>코스 완료</Button>
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
