// 학습자 대시보드 타입
export interface LearnerDashboard {
  // 오늘의 학습
  todayProgress: TodayProgress;

  // 스킬 진행 상황
  activeSkills: SkillProgress[];

  // 스트릭
  streak: StreakInfo;

  // 성취
  recentAchievements: Achievement[];
  totalXP: number;
  level: number;

  // AI 인사이트
  aiInsights: AIInsights;

  // 학습 패턴
  learningPattern: LearningPattern;
}

export interface TodayProgress {
  lessonsCompleted: number;
  lessonsTarget: number;
  studyTimeMinutes: number;
  xpEarned: number;
}

export interface SkillProgress {
  skillId: string;
  skillName: string;
  icon: string;
  progress: number;           // 0-100
  currentChapter: string;
  estimatedCompletion: Date;
  lastStudied: Date;
  totalTimeSpent: number;     // 분
}

export interface StreakInfo {
  current: number;
  longest: number;
  thisWeek: boolean[];  // [일, 월, 화, 수, 목, 금, 토]
  lastStudyDate: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
}

export interface AIInsights {
  strengths: string[];
  areasToImprove: string[];
  recommendation: string;
  predictedMastery: PredictedMastery[];
  motivationalMessage: string;
}

export interface PredictedMastery {
  skillName: string;
  date: Date;
  confidence: number;
}

export interface LearningPattern {
  bestDays: string[];         // ['화', '목']
  bestHours: number[];        // [9, 10, 20, 21]
  avgSessionLength: number;   // 분
  completionRate: number;     // %
  totalStudyDays: number;
  totalStudyHours: number;
}

// 적응형 학습 관련 타입
export interface LearnerState {
  userId: string;
  skillId: string;

  // 지식 상태 (Bayesian Knowledge Tracing)
  knowledgeComponents: KnowledgeComponent[];

  // 학습 패턴
  avgSessionLength: number;
  preferredTime: number[];
  completionRate: number;

  // 성과
  quizScores: number[];
  mistakePatterns: MistakePattern[];

  // 예측
  estimatedMastery: number;
  predictedCompletionDate: Date;
  riskOfDropout: number;
}

export interface KnowledgeComponent {
  id: string;
  name: string;
  pKnown: number;              // 알고 있을 확률 (0-1)
  lastPracticed: Date;
  correctStreak: number;
  totalAttempts: number;
}

export interface MistakePattern {
  topic: string;
  frequency: number;
  lastOccurred: Date;
  resolved: boolean;
}

// 레벨 시스템
export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  300,    // Level 3
  600,    // Level 4
  1000,   // Level 5
  1500,   // Level 6
  2100,   // Level 7
  2800,   // Level 8
  3600,   // Level 9
  4500,   // Level 10
  5500,   // Level 11
  6600,   // Level 12
  7800,   // Level 13
  9100,   // Level 14
  10500,  // Level 15
];

export function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

export function xpToNextLevel(xp: number): { current: number; required: number } {
  const level = calculateLevel(xp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];

  return {
    current: xp - currentThreshold,
    required: nextThreshold - currentThreshold,
  };
}
