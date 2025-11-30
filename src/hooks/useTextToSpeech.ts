'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTextToSpeechOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceName?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onBoundary?: (event: SpeechSynthesisEvent) => void;
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}) {
  const {
    language = 'ko-KR',
    rate = 1,
    pitch = 1,
    volume = 1,
    voiceName,
    onStart,
    onEnd,
    onError,
    onBoundary,
  } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // 브라우저 지원 확인
    setIsSupported('speechSynthesis' in window);

    if ('speechSynthesis' in window) {
      // 사용 가능한 음성 목록 로드
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);

        // 한국어 음성 찾기
        const koreanVoices = availableVoices.filter(voice =>
          voice.lang.startsWith('ko')
        );

        // 선호하는 음성 선택
        if (voiceName) {
          const preferredVoice = availableVoices.find(v => v.name === voiceName);
          if (preferredVoice) {
            setSelectedVoice(preferredVoice);
            return;
          }
        }

        // 한국어 음성이 있으면 선택
        if (koreanVoices.length > 0) {
          // Google 한국어 음성 선호
          const googleKorean = koreanVoices.find(v => v.name.includes('Google'));
          setSelectedVoice(googleKorean || koreanVoices[0]);
        } else {
          // 기본 음성 선택
          const defaultVoice = availableVoices.find(v => v.default);
          setSelectedVoice(defaultVoice || availableVoices[0]);
        }
      };

      // 음성 목록이 비동기로 로드될 수 있음
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;

      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, [voiceName]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text) return;

    // 이전 발화 중지
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      onStart?.();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error('TTS Error:', event.error);
      setIsSpeaking(false);
      setIsPaused(false);
      onError?.(event.error);
    };

    utterance.onboundary = (event) => {
      onBoundary?.(event);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, language, rate, pitch, volume, selectedVoice, onStart, onEnd, onError, onBoundary]);

  const pause = useCallback(() => {
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSpeaking, isPaused]);

  const resume = useCallback(() => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const getKoreanVoices = useCallback(() => {
    return voices.filter(voice => voice.lang.startsWith('ko'));
  }, [voices]);

  return {
    isSupported,
    isSpeaking,
    isPaused,
    voices,
    selectedVoice,
    setSelectedVoice,
    speak,
    pause,
    resume,
    stop,
    getKoreanVoices,
  };
}
