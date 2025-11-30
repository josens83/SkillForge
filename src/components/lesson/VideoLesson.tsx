'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoLessonProps {
  content: {
    videoUrl?: string;
    description?: string;
  };
  lastPosition: number | null;
  onProgress: (timeSpent: number, lastPosition?: number) => void;
  onComplete: () => void;
}

export function VideoLesson({ content, lastPosition, onProgress, onComplete }: VideoLessonProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCompleted, setHasCompleted] = useState(false);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 마지막 재생 위치로 이동
    if (lastPosition) {
      video.currentTime = lastPosition;
    }

    // 진도 저장 인터벌
    const interval = setInterval(() => {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      onProgress(timeSpent, video.currentTime);
    }, 30000); // 30초마다 저장

    // 비디오 끝났을 때
    const handleEnded = () => {
      if (!hasCompleted) {
        setHasCompleted(true);
        onComplete();
      }
    };

    // 90% 이상 시청 시 완료
    const handleTimeUpdate = () => {
      if (!hasCompleted && video.duration && video.currentTime / video.duration >= 0.9) {
        setHasCompleted(true);
        onComplete();
      }
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      clearInterval(interval);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('timeupdate', handleTimeUpdate);

      // 언마운트 시 진도 저장
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      onProgress(timeSpent, video.currentTime);
    };
  }, [lastPosition, hasCompleted]);

  if (!content.videoUrl) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">비디오를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={content.videoUrl}
          controls
          className="w-full h-full"
          playsInline
        >
          브라우저가 비디오 재생을 지원하지 않습니다.
        </video>
      </div>
      {content.description && (
        <div className="prose dark:prose-invert max-w-none">
          <p>{content.description}</p>
        </div>
      )}
    </div>
  );
}
