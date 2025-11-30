'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizLessonProps {
  content: {
    questions?: QuizQuestion[];
    passingScore?: number;
  };
  onComplete: (score: number) => void;
}

export function QuizLesson({ content, onComplete }: QuizLessonProps) {
  const questions = content.questions || [];
  const passingScore = content.passingScore || 70;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [quizCompleted, setQuizCompleted] = useState(false);

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">퀴즈 문제가 없습니다.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  const handleSelectAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers];
    newAnswers[currentIndex] = selectedAnswer;
    setAnswers(newAnswers);
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // 퀴즈 완료
      const correctCount = answers.filter(
        (answer, idx) => answer === questions[idx].correctAnswer
      ).length + (isCorrect ? 1 : 0);
      const score = Math.round((correctCount / questions.length) * 100);

      setQuizCompleted(true);
      onComplete(score);
    }
  };

  if (quizCompleted) {
    const correctCount = answers.filter(
      (answer, idx) => answer === questions[idx].correctAnswer
    ).length;
    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= passingScore;

    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <div className={`text-6xl mb-4 ${passed ? 'text-green-500' : 'text-orange-500'}`}>
          {passed ? <CheckCircle2 className="h-16 w-16 mx-auto" /> : <XCircle className="h-16 w-16 mx-auto" />}
        </div>
        <h2 className="text-2xl font-bold mb-2">
          {passed ? '축하합니다!' : '다시 도전해보세요!'}
        </h2>
        <p className="text-muted-foreground mb-6">
          {questions.length}문제 중 {correctCount}문제 정답
        </p>
        <div className="text-4xl font-bold mb-2">{score}점</div>
        <p className="text-sm text-muted-foreground mb-6">
          합격 기준: {passingScore}점
        </p>

        {!passed && (
          <Button
            onClick={() => {
              setCurrentIndex(0);
              setSelectedAnswer(null);
              setShowResult(false);
              setAnswers(new Array(questions.length).fill(null));
              setQuizCompleted(false);
            }}
          >
            다시 풀기
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>문제 {currentIndex + 1} / {questions.length}</span>
          <span>{Math.round(((currentIndex) / questions.length) * 100)}% 완료</span>
        </div>
        <Progress value={(currentIndex / questions.length) * 100} />
      </div>

      {/* Question */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-6">{currentQuestion.question}</h3>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              let bgClass = 'hover:bg-muted';

              if (showResult) {
                if (index === currentQuestion.correctAnswer) {
                  bgClass = 'bg-green-100 border-green-500 dark:bg-green-900/30';
                } else if (index === selectedAnswer && !isCorrect) {
                  bgClass = 'bg-red-100 border-red-500 dark:bg-red-900/30';
                }
              } else if (selectedAnswer === index) {
                bgClass = 'bg-primary/10 border-primary';
              }

              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={showResult}
                  className={`w-full p-4 text-left rounded-lg border transition-colors ${bgClass}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showResult && (
            <div className={`mt-6 p-4 rounded-lg ${isCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
              <div className="flex items-center gap-2 font-medium mb-2">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-green-700 dark:text-green-400">정답입니다!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-700 dark:text-red-400">오답입니다.</span>
                  </>
                )}
              </div>
              <p className="text-sm">{currentQuestion.explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {!showResult ? (
          <Button onClick={handleSubmit} disabled={selectedAnswer === null}>
            제출하기
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {currentIndex < questions.length - 1 ? (
              <>
                다음 문제
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            ) : (
              '결과 보기'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
