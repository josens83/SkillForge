// 스킬 카테고리
export type SkillCategory =
  | 'programming'      // 프로그래밍
  | 'language'         // 외국어
  | 'business'         // 비즈니스 스킬
  | 'certification'    // 자격증
  | 'data'             // 데이터/AI
  | 'design'           // 디자인
  | 'finance'          // 금융/투자
  | 'marketing';       // 마케팅

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface CertificationInfo {
  name: string;
  organization: string;
  examFormat: string;
  passingScore: number;
}

export interface SkillTree {
  id: string;
  category: SkillCategory;
  name: string;
  description: string;
  icon: string;
  difficulty: Difficulty;
  estimatedHours: number;
  prerequisites: string[];  // 선수 스킬 ID
  courses: Course[];
  certification?: CertificationInfo;
}

export interface Course {
  id: string;
  skillId: string;
  title: string;
  description: string;
  thumbnail: string;

  // 구조
  chapters: Chapter[];
  totalLessons: number;
  totalDuration: number;  // 분

  // 메타
  instructor: Instructor;
  rating: number;
  enrollments: number;

  // 접근 권한
  accessType: 'free' | 'premium' | 'purchase';
  price?: number;  // purchase인 경우
}

export interface Instructor {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  expertise: string[];
}

export interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  duration: number;  // 분
  content: LessonContent;
  aiTutorEnabled: boolean;

  // 완료 조건
  completionCriteria: CompletionCriteria;
}

export type LessonType =
  | 'video'           // 영상 강의
  | 'article'         // 텍스트 강의
  | 'ai_conversation' // AI 튜터 대화 (핵심!)
  | 'quiz'            // 퀴즈
  | 'coding_exercise' // 코딩 실습
  | 'speaking'        // 스피킹 연습
  | 'project';        // 프로젝트

export interface LessonContent {
  videoUrl?: string;
  articleContent?: string;
  quizQuestions?: QuizQuestion[];
  codingExercise?: CodingExercise;
  speakingPrompt?: string;
  projectDescription?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface CodingExercise {
  language: 'python' | 'javascript' | 'sql' | 'html';
  initialCode: string;
  testCases: TestCase[];
  hints: string[];
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface CompletionCriteria {
  type: 'view' | 'score' | 'time' | 'submission';
  threshold?: number;  // score인 경우 최소 점수
}

// 초기 스킬 데이터
export const INITIAL_SKILLS: Omit<SkillTree, 'courses'>[] = [
  {
    id: 'python-fundamentals',
    category: 'programming',
    name: 'Python 기초',
    description: '프로그래밍 입문자를 위한 Python 기초 과정입니다.',
    icon: '🐍',
    difficulty: 'beginner',
    estimatedHours: 20,
    prerequisites: [],
  },
  {
    id: 'english-conversation',
    category: 'language',
    name: '비즈니스 영어 회화',
    description: '실무에서 바로 사용할 수 있는 비즈니스 영어 회화를 학습합니다.',
    icon: '🌎',
    difficulty: 'intermediate',
    estimatedHours: 40,
    prerequisites: [],
  },
  {
    id: 'sqld',
    category: 'certification',
    name: 'SQLD 자격증',
    description: 'SQL 개발자 자격증 취득을 위한 완벽 대비 과정입니다.',
    icon: '📊',
    difficulty: 'intermediate',
    estimatedHours: 30,
    prerequisites: [],
  },
  {
    id: 'excel-advanced',
    category: 'business',
    name: '엑셀 고급 (피벗, 매크로)',
    description: '엑셀 피벗 테이블과 VBA 매크로를 마스터합니다.',
    icon: '📈',
    difficulty: 'intermediate',
    estimatedHours: 15,
    prerequisites: [],
  },
  {
    id: 'javascript-fundamentals',
    category: 'programming',
    name: 'JavaScript 기초',
    description: '웹 개발의 핵심 언어 JavaScript를 배웁니다.',
    icon: '⚡',
    difficulty: 'beginner',
    estimatedHours: 25,
    prerequisites: [],
  },
  {
    id: 'data-analysis-python',
    category: 'data',
    name: 'Python 데이터 분석',
    description: 'Pandas, NumPy를 활용한 데이터 분석을 학습합니다.',
    icon: '📊',
    difficulty: 'intermediate',
    estimatedHours: 35,
    prerequisites: ['python-fundamentals'],
  },
];
