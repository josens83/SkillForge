'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AI_TUTORS } from '@/types/ai-tutor';
import { Send, Loader2, CheckCircle2, Mic, Keyboard } from 'lucide-react';
import { VoiceChat } from '@/components/ai-tutor/VoiceChat';

interface Message {
  id: string;
  role: 'user' | 'tutor';
  content: string;
  timestamp: Date;
}

interface AIConversationLessonProps {
  lessonId: string;
  content: {
    tutorId?: string;
    topic?: string;
    objectives?: string[];
    minMessages?: number;
  };
  onComplete: () => void;
}

export function AIConversationLesson({ lessonId, content, onComplete }: AIConversationLessonProps) {
  const tutorId = content.tutorId || 'maya';
  const tutor = AI_TUTORS.find(t => t.id === tutorId) || AI_TUTORS[0];
  const minMessages = content.minMessages || 5;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [canComplete, setCanComplete] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 초기 튜터 인사
    const introMessage: Message = {
      id: 'intro',
      role: 'tutor',
      content: content.topic
        ? `안녕하세요! 오늘은 "${content.topic}"에 대해 함께 공부해볼까요? 궁금한 점이 있으면 편하게 물어보세요!`
        : tutor.introduction,
      timestamp: new Date(),
    };
    setMessages([introMessage]);
  }, [tutor, content.topic]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (userMessageCount >= minMessages && !canComplete) {
      setCanComplete(true);
    }
  }, [userMessageCount, minMessages, canComplete]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setUserMessageCount(prev => prev + 1);

    try {
      const response = await fetch('/api/ai-tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          tutorId,
          lessonId,
          conversationId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setConversationId(data.conversationId);

        const tutorMessage: Message = {
          id: Date.now().toString() + '-tutor',
          role: 'tutor',
          content: data.message,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, tutorMessage]);
      } else {
        const errorMessage: Message = {
          id: Date.now().toString() + '-error',
          role: 'tutor',
          content: data.error || '죄송해요, 응답을 생성하는데 문제가 발생했어요. 다시 시도해주세요.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        role: 'tutor',
        content: '네트워크 오류가 발생했어요. 인터넷 연결을 확인해주세요.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 음성 메시지 처리 (VoiceChat에서 사용)
  const handleVoiceMessage = useCallback(async (message: string): Promise<string> => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setUserMessageCount(prev => prev + 1);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          tutorId,
          lessonId,
          conversationId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setConversationId(data.conversationId);

        const tutorMessage: Message = {
          id: Date.now().toString() + '-tutor',
          role: 'tutor',
          content: data.message,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, tutorMessage]);
        return data.message;
      } else {
        const errorMessage: Message = {
          id: Date.now().toString() + '-error',
          role: 'tutor',
          content: data.error || '죄송해요, 응답을 생성하는데 문제가 발생했어요.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        return errorMessage.content;
      }
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        role: 'tutor',
        content: '네트워크 오류가 발생했어요.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return errorMessage.content;
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, lessonId, tutorId]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Objectives */}
      {content.objectives && content.objectives.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">학습 목표</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <ul className="text-sm space-y-1">
              {content.objectives.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {obj}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      <Card className="flex flex-col h-[500px]">
        <CardHeader className="border-b py-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={tutor.avatar} alt={tutor.name} />
              <AvatarFallback>{tutor.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{tutor.name}</CardTitle>
              <p className="text-xs text-muted-foreground">AI 튜터</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">{tutor.name}이(가) 입력 중...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        <div className="border-t p-4 flex-shrink-0 space-y-3">
          {/* Input Mode Toggle */}
          <div className="flex justify-center mb-2">
            <div className="inline-flex rounded-lg border p-1 bg-muted/30">
              <Button
                variant={inputMode === 'text' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setInputMode('text')}
                className="rounded-md"
              >
                <Keyboard className="h-4 w-4 mr-1" />
                텍스트
              </Button>
              <Button
                variant={inputMode === 'voice' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setInputMode('voice')}
                className="rounded-md"
              >
                <Mic className="h-4 w-4 mr-1" />
                음성
              </Button>
            </div>
          </div>

          {inputMode === 'text' ? (
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력하세요..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <VoiceChat
              onSendMessage={handleVoiceMessage}
              isLoading={isLoading}
              disabled={false}
            />
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              대화 진행률: {userMessageCount}/{minMessages}
            </p>
            {canComplete && (
              <Button size="sm" onClick={onComplete}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                레슨 완료
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
