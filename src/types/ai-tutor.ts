import { SkillCategory } from './skill';

// AI 튜터 성격 타입
export type TutorPersonality =
  | 'encouraging'    // 격려형 (초보자 추천)
  | 'socratic'       // 소크라테스식 질문
  | 'practical'      // 실용적/직접적
  | 'analytical';    // 분석적/논리적

export interface TeachingStyle {
  encouragement: number;    // 0-1: 격려 빈도
  strictness: number;       // 0-1: 엄격함
  humorLevel: number;       // 0-1: 유머
  explanationDepth: number; // 0-1: 설명 깊이
}

export interface AITutor {
  id: string;
  name: string;
  avatar: string;
  personality: TutorPersonality;
  specialization: SkillCategory[];
  voiceId: string;
  teachingStyle: TeachingStyle;
  introduction: string;
}

// 기본 AI 튜터들
export const AI_TUTORS: AITutor[] = [
  {
    id: 'maya',
    name: '마야',
    avatar: '/tutors/maya.png',
    personality: 'encouraging',
    specialization: ['programming', 'data'],
    voiceId: 'korean-female-warm',
    teachingStyle: {
      encouragement: 0.9,
      strictness: 0.3,
      humorLevel: 0.6,
      explanationDepth: 0.8,
    },
    introduction: '안녕하세요! 저는 프로그래밍과 데이터 분석을 가르치는 마야예요. 함께 즐겁게 배워봐요!',
  },
  {
    id: 'james',
    name: '제임스',
    avatar: '/tutors/james.png',
    personality: 'practical',
    specialization: ['language', 'business'],
    voiceId: 'american-male-professional',
    teachingStyle: {
      encouragement: 0.6,
      strictness: 0.5,
      humorLevel: 0.4,
      explanationDepth: 0.7,
    },
    introduction: "Hi! I'm James, your business English coach. Let's make your English practical and professional!",
  },
  {
    id: 'dr-kim',
    name: '김박사',
    avatar: '/tutors/dr-kim.png',
    personality: 'analytical',
    specialization: ['certification', 'finance'],
    voiceId: 'korean-male-authoritative',
    teachingStyle: {
      encouragement: 0.5,
      strictness: 0.8,
      humorLevel: 0.2,
      explanationDepth: 0.95,
    },
    introduction: '안녕하세요, 김박사입니다. 자격증 시험 합격의 지름길을 안내해 드리겠습니다.',
  },
  {
    id: 'yuki',
    name: '유키',
    avatar: '/tutors/yuki.png',
    personality: 'socratic',
    specialization: ['design', 'marketing'],
    voiceId: 'korean-female-creative',
    teachingStyle: {
      encouragement: 0.7,
      strictness: 0.4,
      humorLevel: 0.5,
      explanationDepth: 0.75,
    },
    introduction: '안녕하세요, 유키입니다! 디자인과 마케팅의 세계로 함께 떠나볼까요?',
  },
];

// 대화 관련 타입
export interface Message {
  id: string;
  role: 'user' | 'tutor' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    emotion?: string;
    confidence?: number;
    audioUrl?: string;
  };
}

export interface Mistake {
  id: string;
  description: string;
  topic: string;
  timestamp: Date;
  corrected: boolean;
}

export interface LearnerProfile {
  id: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  learningStyle: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  pacePreference: 'slow' | 'normal' | 'fast';
  weakAreas: string[];
  strongAreas: string[];
  preferredLanguage: 'ko' | 'en' | 'mixed';
}

export interface ConversationContext {
  lessonId: string;
  lessonContent: string;
  learnerProfile: LearnerProfile;
  conversationHistory: Message[];
  currentTopic: string;
  learnerMistakes: Mistake[];
  sessionGoals: string[];
}

export interface TutorResponse {
  message: string;
  audioUrl?: string;
  analysis?: {
    understanding: number;
    needsClarification: boolean;
    suggestedTopic?: string;
  };
  suggestedFollowUp?: string;
}

// 음성 대화 상태
export interface VoiceConversationState {
  status: 'idle' | 'listening' | 'processing' | 'speaking';
  transcript: string;
  audioLevel: number;
  error: string | null;
}

// 발음 평가 (언어 학습용)
export interface PronunciationScore {
  overall: number;          // 0-100
  accuracy: number;         // 정확도
  fluency: number;          // 유창성
  completeness: number;     // 완성도
  prosody: number;          // 운율/억양
  problemWords: ProblemWord[];
}

export interface ProblemWord {
  word: string;
  expected: string;         // IPA
  actual: string;           // IPA
  suggestion: string;       // 개선 팁
}

// 헬퍼 함수
export function getTutorById(tutorId: string): AITutor | undefined {
  return AI_TUTORS.find(tutor => tutor.id === tutorId);
}

export function getTutorsBySpecialization(category: SkillCategory): AITutor[] {
  return AI_TUTORS.filter(tutor => tutor.specialization.includes(category));
}
