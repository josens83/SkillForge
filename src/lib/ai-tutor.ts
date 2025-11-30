import Anthropic from '@anthropic-ai/sdk';
import { AITutor, ConversationContext, TutorResponse, AI_TUTORS } from '@/types/ai-tutor';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// AI 튜터 시스템 프롬프트 생성
export function buildTutorSystemPrompt(
  tutor: AITutor,
  context: ConversationContext
): string {
  const mistakesText = context.learnerMistakes.length > 0
    ? context.learnerMistakes.map(m => `- ${m.description}`).join('\n')
    : '- 아직 없음';

  return `당신은 ${tutor.name}, SkillForge의 AI 튜터입니다.

## 당신의 성격
- 교육 스타일: ${tutor.personality}
- 격려 수준: ${Math.round(tutor.teachingStyle.encouragement * 100)}%
- 엄격함: ${Math.round(tutor.teachingStyle.strictness * 100)}%
- 유머: ${Math.round(tutor.teachingStyle.humorLevel * 100)}%
- 설명 깊이: ${Math.round(tutor.teachingStyle.explanationDepth * 100)}%

## 현재 레슨 컨텍스트
- 주제: ${context.currentTopic}
- 학습자 레벨: ${context.learnerProfile.level}
- 학습 스타일: ${context.learnerProfile.learningStyle}
- 선호 속도: ${context.learnerProfile.pacePreference}
- 약점 영역: ${context.learnerProfile.weakAreas.join(', ') || '미파악'}
- 강점 영역: ${context.learnerProfile.strongAreas.join(', ') || '미파악'}

## 레슨 내용
${context.lessonContent}

## 이번 세션 목표
${context.sessionGoals.map((g, i) => `${i + 1}. ${g}`).join('\n')}

## 지금까지 학습자가 틀린 부분
${mistakesText}

## 튜터링 가이드라인
1. 학습자의 레벨에 맞는 설명을 제공하세요.
2. 틀린 부분은 직접 답을 주지 말고, 힌트로 유도하세요.
3. 작은 성취도 인정하고 격려하세요.
4. 실생활 예시를 활용하세요.
5. 한 번에 너무 많은 정보를 주지 마세요.
6. 질문으로 학습자의 이해도를 확인하세요.
7. 응답은 간결하게 (3-4문장 이내).
8. 학습자의 선호 언어(${context.learnerProfile.preferredLanguage})에 맞춰 응답하세요.

## 응답 형식
- 자연스러운 대화체 사용
- 필요시 코드/예시는 마크다운 포맷
- 절대로 욕설이나 부적절한 표현을 사용하지 마세요.`;
}

// AI 응답 생성
export async function generateTutorResponse(
  context: ConversationContext,
  tutor: AITutor,
  userMessage: string
): Promise<TutorResponse> {
  const systemPrompt = buildTutorSystemPrompt(tutor, context);

  const messages = context.conversationHistory.map(m => ({
    role: m.role === 'tutor' ? 'assistant' as const : 'user' as const,
    content: m.content,
  }));

  messages.push({ role: 'user', content: userMessage });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: systemPrompt,
    messages,
  });

  const tutorMessage = response.content[0].type === 'text'
    ? response.content[0].text
    : '';

  // 학습자 응답 분석
  const analysis = await analyzeLearnerResponse(userMessage, context, tutor);

  return {
    message: tutorMessage,
    analysis,
    suggestedFollowUp: analysis.needsClarification
      ? await generateClarificationQuestion(userMessage, context, tutor)
      : undefined,
  };
}

// 학습자 응답 분석
async function analyzeLearnerResponse(
  userMessage: string,
  context: ConversationContext,
  tutor: AITutor
): Promise<{
  understanding: number;
  needsClarification: boolean;
  suggestedTopic?: string;
}> {
  const analysisPrompt = `학습자의 응답을 분석해주세요.

주제: ${context.currentTopic}
학습자 응답: "${userMessage}"

다음 JSON 형식으로만 응답하세요:
{
  "understanding": 0-100 사이의 이해도 점수,
  "needsClarification": true/false,
  "suggestedTopic": "추가 설명이 필요한 주제" (선택적)
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{ role: 'user', content: analysisPrompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    return JSON.parse(text);
  } catch {
    return {
      understanding: 50,
      needsClarification: false,
    };
  }
}

// 명확화 질문 생성
async function generateClarificationQuestion(
  userMessage: string,
  context: ConversationContext,
  tutor: AITutor
): Promise<string> {
  const prompt = `학습자가 "${userMessage}"라고 했습니다.
주제: ${context.currentTopic}

학습자의 이해를 확인하기 위한 간단한 후속 질문을 한국어로 작성해주세요.
질문만 작성하세요.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 100,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

// 코드 힌트 생성
export async function generateCodeHint(
  currentCode: string,
  language: string,
  testCases: { input: string; expectedOutput: string; isHidden: boolean }[]
): Promise<string> {
  const visibleTestCases = testCases
    .filter(tc => !tc.isHidden)
    .map(tc => `입력: ${tc.input} → 기대 출력: ${tc.expectedOutput}`)
    .join('\n');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    system: `당신은 코딩 튜터입니다. 직접적인 정답을 주지 말고, 학습자가 스스로
문제를 해결할 수 있도록 힌트만 제공하세요. 힌트는 2-3문장으로 간결하게 한국어로 작성하세요.`,
    messages: [{
      role: 'user',
      content: `언어: ${language}

현재 코드:
\`\`\`${language}
${currentCode}
\`\`\`

테스트 케이스:
${visibleTestCases}

학습자가 막혀있는 것 같습니다. 힌트를 주세요.`,
    }],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

// 학습 인사이트 생성
export async function generateLearnerInsights(learnerData: {
  totalStudyTime: number;
  completedLessons: number;
  avgQuizScore: number;
  topicPerformance: { name: string; accuracy: number }[];
  preferredHours: number[];
  avgSessionLength: number;
  weeklyStreak: number;
  commonMistakes: string[];
}): Promise<{
  strengths: string[];
  areasToImprove: string[];
  recommendation: string;
  motivationalMessage: string;
}> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: '당신은 학습 분석 전문가입니다. 학습자 데이터를 분석하고 실행 가능한 인사이트를 제공하세요.',
    messages: [{
      role: 'user',
      content: `## 학습자 데이터

### 최근 30일 학습 기록
- 총 학습 시간: ${learnerData.totalStudyTime}분
- 완료 레슨: ${learnerData.completedLessons}개
- 평균 퀴즈 점수: ${learnerData.avgQuizScore}점

### 주제별 성과
${learnerData.topicPerformance.map(t => `- ${t.name}: ${t.accuracy}% 정확도`).join('\n')}

### 학습 패턴
- 주로 학습하는 시간: ${learnerData.preferredHours.join(', ')}시
- 평균 세션 길이: ${learnerData.avgSessionLength}분
- 이번 주 스트릭: ${learnerData.weeklyStreak}일

### 자주 틀리는 유형
${learnerData.commonMistakes.join('\n')}

위 데이터를 분석하여 다음을 JSON 형식으로 제공하세요:
{
  "strengths": ["강점 3가지"],
  "areasToImprove": ["개선 필요 영역 3가지"],
  "recommendation": "이번 주 추천 학습 계획",
  "motivationalMessage": "동기부여 메시지"
}`,
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';

  try {
    return JSON.parse(text);
  } catch {
    return {
      strengths: ['꾸준한 학습 습관'],
      areasToImprove: ['더 많은 연습이 필요합니다'],
      recommendation: '오늘 새로운 레슨을 시작해보세요!',
      motivationalMessage: '화이팅! 조금씩 성장하고 있어요.',
    };
  }
}

// 튜터 ID로 튜터 가져오기
export function getTutorById(tutorId: string): AITutor | undefined {
  return AI_TUTORS.find(t => t.id === tutorId);
}
