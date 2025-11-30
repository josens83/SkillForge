'use client';

import { useEffect, useState } from 'react';

interface ArticleLessonProps {
  content: {
    articleContent?: string;
    readingTime?: number;
  };
  onComplete: () => void;
}

export function ArticleLesson({ content, onComplete }: ArticleLessonProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(Math.min(progress, 100));

      // 90% 이상 스크롤하면 완료
      if (!hasCompleted && progress >= 90) {
        setHasCompleted(true);
        onComplete();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasCompleted, onComplete]);

  if (!content.articleContent) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">내용을 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Reading Progress */}
      <div className="fixed top-14 left-0 right-0 h-1 bg-muted z-40">
        <div
          className="h-full bg-primary transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {content.readingTime && (
        <p className="text-sm text-muted-foreground">
          예상 읽기 시간: {content.readingTime}분
        </p>
      )}

      <article className="prose dark:prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: content.articleContent }} />
      </article>
    </div>
  );
}
