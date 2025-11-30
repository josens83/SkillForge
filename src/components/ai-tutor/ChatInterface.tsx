'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AI_TUTORS, AITutor, Message } from '@/types/ai-tutor';
import { Send, Mic, MicOff, Loader2 } from 'lucide-react';

interface ChatInterfaceProps {
  tutorId: string;
  lessonId?: string;
  onClose?: () => void;
}

export function ChatInterface({ tutorId, lessonId, onClose }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const tutor = AI_TUTORS.find(t => t.id === tutorId) || AI_TUTORS[0];

  useEffect(() => {
    // 초기 인사 메시지
    const introMessage: Message = {
      id: 'intro',
      role: 'tutor',
      content: tutor.introduction,
      timestamp: new Date(),
    };
    setMessages([introMessage]);
  }, [tutor]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        // 에러 메시지 표시
        const errorMessage: Message = {
          id: Date.now().toString() + '-error',
          role: 'system',
          content: data.error || '응답을 받는데 실패했습니다.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        role: 'system',
        content: '네트워크 오류가 발생했습니다.',
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

  const toggleListening = () => {
    // 음성 인식 기능 (추후 구현)
    setIsListening(!isListening);
  };

  return (
    <Card className="flex flex-col h-[600px] max-w-2xl mx-auto">
      <CardHeader className="border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={tutor.avatar} alt={tutor.name} />
              <AvatarFallback>{tutor.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{tutor.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {tutor.specialization.map(s => {
                  const names: Record<string, string> = {
                    programming: '프로그래밍',
                    language: '외국어',
                    business: '비즈니스',
                    certification: '자격증',
                    data: '데이터',
                    design: '디자인',
                    finance: '금융',
                    marketing: '마케팅',
                  };
                  return names[s] || s;
                }).join(', ')} 전문
              </p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              닫기
            </Button>
          )}
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
                  : message.role === 'system'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-muted'
              }`}
            >
              {message.role === 'tutor' && (
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={tutor.avatar} alt={tutor.name} />
                    <AvatarFallback>{tutor.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">{tutor.name}</span>
                </div>
              )}
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
                <span className="text-sm">응답 중...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      <div className="border-t p-4 flex-shrink-0">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleListening}
            className={isListening ? 'bg-red-100 text-red-600' : ''}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
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
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI 튜터가 생성한 응답입니다. 중요한 정보는 항상 확인하세요.
        </p>
      </div>
    </Card>
  );
}
