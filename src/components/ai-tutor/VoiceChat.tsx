'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { Mic, MicOff, Volume2, VolumeX, Square, Loader2, AlertCircle } from 'lucide-react';

interface VoiceChatProps {
  onSendMessage: (message: string) => Promise<string>;
  isLoading?: boolean;
  disabled?: boolean;
}

export function VoiceChat({ onSendMessage, isLoading = false, disabled = false }: VoiceChatProps) {
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<string>('');
  const [autoSpeak, setAutoSpeak] = useState(true);

  const {
    isListening,
    isSupported: sttSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    language: 'ko-KR',
    continuous: false,
    interimResults: true,
    onError: (err) => setError(err),
    onEnd: async () => {
      // 음성 인식이 끝나면 메시지 전송
      const finalText = transcript.trim();
      if (finalText && !isLoading) {
        try {
          setError(null);
          const response = await onSendMessage(finalText);
          setLastResponse(response);

          // 자동 음성 출력
          if (autoSpeak && response) {
            speak(response);
          }
        } catch (err) {
          setError('메시지 전송에 실패했습니다.');
        }
      }
      resetTranscript();
    },
  });

  const {
    isSupported: ttsSupported,
    isSpeaking,
    speak,
    stop: stopSpeaking,
  } = useTextToSpeech({
    language: 'ko-KR',
    rate: 1.0,
    pitch: 1.0,
  });

  const handleMicClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      setError(null);
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleStopSpeaking = useCallback(() => {
    stopSpeaking();
  }, [stopSpeaking]);

  const toggleAutoSpeak = useCallback(() => {
    setAutoSpeak(prev => !prev);
  }, []);

  // 음성 인식/합성 지원 확인
  const isVoiceSupported = sttSupported && ttsSupported;

  if (!isVoiceSupported) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-yellow-700">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">
              이 브라우저는 음성 대화 기능을 지원하지 않습니다.
              Chrome 또는 Edge 브라우저를 사용해주세요.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Voice Controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Microphone Button */}
        <Button
          size="lg"
          variant={isListening ? 'destructive' : 'default'}
          className={`rounded-full h-16 w-16 ${
            isListening ? 'animate-pulse' : ''
          }`}
          onClick={handleMicClick}
          disabled={disabled || isLoading || isSpeaking}
        >
          {isListening ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>

        {/* Stop Speaking Button */}
        {isSpeaking && (
          <Button
            size="lg"
            variant="outline"
            className="rounded-full h-16 w-16"
            onClick={handleStopSpeaking}
          >
            <Square className="h-6 w-6" />
          </Button>
        )}

        {/* Auto-speak Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleAutoSpeak}
          className={autoSpeak ? 'text-primary' : 'text-muted-foreground'}
        >
          {autoSpeak ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <VolumeX className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Status Text */}
      <div className="text-center">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>AI가 응답을 생성 중입니다...</span>
          </div>
        )}
        {isListening && (
          <div className="space-y-2">
            <p className="text-primary font-medium">듣고 있습니다...</p>
            {(transcript || interimTranscript) && (
              <Card className="bg-muted/50">
                <CardContent className="py-3">
                  <p className="text-sm">
                    {transcript}
                    <span className="text-muted-foreground">{interimTranscript}</span>
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        {isSpeaking && (
          <p className="text-primary font-medium">AI가 말하고 있습니다...</p>
        )}
        {!isListening && !isSpeaking && !isLoading && (
          <p className="text-muted-foreground text-sm">
            마이크 버튼을 눌러 말씀해주세요
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p>마이크 버튼을 누르고 질문하세요</p>
        <p>AI 튜터가 음성으로 답변합니다</p>
        {!autoSpeak && <p className="text-yellow-600">자동 음성 출력이 꺼져 있습니다</p>}
      </div>
    </div>
  );
}
