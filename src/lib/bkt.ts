/**
 * Bayesian Knowledge Tracing (BKT) Implementation
 *
 * BKT는 학습자의 지식 상태를 추적하고 예측하는 알고리즘입니다.
 * 학습자가 문제를 맞추거나 틀릴 때마다 지식 상태를 업데이트합니다.
 */

export interface BKTParams {
  // P(L0): 초기 학습 확률 - 학습자가 해당 지식을 이미 알고 있을 확률
  pInit: number;
  // P(T): 학습 확률 - 모르는 상태에서 알게 될 확률
  pLearn: number;
  // P(G): 추측 확률 - 모르는데 맞출 확률 (guessing)
  pGuess: number;
  // P(S): 실수 확률 - 알고 있는데 틀릴 확률 (slip)
  pSlip: number;
}

export interface KnowledgeState {
  componentId: string;
  componentName: string;
  pKnown: number; // 현재 지식 상태 (알고 있을 확률)
  attempts: number;
  correctAttempts: number;
  lastUpdated: Date;
}

// 기본 BKT 파라미터
export const DEFAULT_BKT_PARAMS: BKTParams = {
  pInit: 0.3,  // 30% 확률로 이미 알고 있음
  pLearn: 0.1, // 10% 확률로 학습됨
  pGuess: 0.2, // 20% 확률로 추측해서 맞춤
  pSlip: 0.1,  // 10% 확률로 실수로 틀림
};

// 난이도별 BKT 파라미터
export const DIFFICULTY_PARAMS: Record<string, BKTParams> = {
  easy: {
    pInit: 0.4,
    pLearn: 0.15,
    pGuess: 0.25,
    pSlip: 0.05,
  },
  medium: {
    pInit: 0.3,
    pLearn: 0.1,
    pGuess: 0.2,
    pSlip: 0.1,
  },
  hard: {
    pInit: 0.2,
    pLearn: 0.08,
    pGuess: 0.15,
    pSlip: 0.12,
  },
  expert: {
    pInit: 0.1,
    pLearn: 0.05,
    pGuess: 0.1,
    pSlip: 0.15,
  },
};

/**
 * BKT 클래스 - 지식 상태 추적
 */
export class BKTEngine {
  private params: BKTParams;

  constructor(params: BKTParams = DEFAULT_BKT_PARAMS) {
    this.params = params;
  }

  /**
   * 문제를 풀었을 때 지식 상태 업데이트
   * @param pKnown 현재 알고 있을 확률
   * @param isCorrect 정답 여부
   * @returns 업데이트된 알고 있을 확률
   */
  updateKnowledge(pKnown: number, isCorrect: boolean): number {
    const { pLearn, pGuess, pSlip } = this.params;

    // P(K|Obs): 관찰 결과에 따른 사후 확률 계산
    let pKnownGivenObs: number;

    if (isCorrect) {
      // 정답을 맞춘 경우
      // P(K|Correct) = P(Correct|K) * P(K) / P(Correct)
      // P(Correct|K) = 1 - P(S) (알고 있으면서 맞춤)
      // P(Correct|~K) = P(G) (모르는데 맞춤)
      // P(Correct) = P(Correct|K) * P(K) + P(Correct|~K) * P(~K)
      const pCorrectGivenKnown = 1 - pSlip;
      const pCorrectGivenNotKnown = pGuess;
      const pCorrect = pCorrectGivenKnown * pKnown + pCorrectGivenNotKnown * (1 - pKnown);

      pKnownGivenObs = (pCorrectGivenKnown * pKnown) / pCorrect;
    } else {
      // 틀린 경우
      // P(K|Wrong) = P(Wrong|K) * P(K) / P(Wrong)
      // P(Wrong|K) = P(S) (알고 있는데 틀림)
      // P(Wrong|~K) = 1 - P(G) (모르는데 틀림)
      const pWrongGivenKnown = pSlip;
      const pWrongGivenNotKnown = 1 - pGuess;
      const pWrong = pWrongGivenKnown * pKnown + pWrongGivenNotKnown * (1 - pKnown);

      pKnownGivenObs = (pWrongGivenKnown * pKnown) / pWrong;
    }

    // 학습 효과 적용
    // P(K_n+1) = P(K|Obs) + (1 - P(K|Obs)) * P(T)
    const pKnownNew = pKnownGivenObs + (1 - pKnownGivenObs) * pLearn;

    // 0과 1 사이로 클램핑
    return Math.max(0.001, Math.min(0.999, pKnownNew));
  }

  /**
   * 다음 문제를 맞출 확률 예측
   * @param pKnown 현재 알고 있을 확률
   * @returns 다음 문제를 맞출 확률
   */
  predictCorrect(pKnown: number): number {
    const { pGuess, pSlip } = this.params;
    // P(Correct) = P(Correct|K) * P(K) + P(Correct|~K) * P(~K)
    return (1 - pSlip) * pKnown + pGuess * (1 - pKnown);
  }

  /**
   * 지식 수준에 따른 추천 난이도
   * @param pKnown 현재 알고 있을 확률
   * @returns 추천 난이도
   */
  recommendDifficulty(pKnown: number): 'easy' | 'medium' | 'hard' | 'expert' {
    if (pKnown < 0.3) return 'easy';
    if (pKnown < 0.5) return 'medium';
    if (pKnown < 0.75) return 'hard';
    return 'expert';
  }

  /**
   * 마스터리 달성 여부 확인
   * @param pKnown 현재 알고 있을 확률
   * @param threshold 마스터리 임계값 (기본 0.95)
   * @returns 마스터리 달성 여부
   */
  isMastered(pKnown: number, threshold: number = 0.95): boolean {
    return pKnown >= threshold;
  }

  /**
   * 복습 필요 여부 확인
   * @param pKnown 현재 알고 있을 확률
   * @param lastUpdated 마지막 업데이트 시간
   * @returns 복습 필요 여부
   */
  needsReview(pKnown: number, lastUpdated: Date): boolean {
    const daysSinceLastUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

    // 망각 곡선 적용 (간단한 지수 감소 모델)
    const forgettingRate = 0.1; // 하루에 10% 감소
    const adjustedPKnown = pKnown * Math.exp(-forgettingRate * daysSinceLastUpdate);

    // 조정된 지식 확률이 60% 미만이면 복습 필요
    return adjustedPKnown < 0.6;
  }

  /**
   * 파라미터 업데이트
   */
  setParams(params: Partial<BKTParams>): void {
    this.params = { ...this.params, ...params };
  }

  /**
   * 현재 파라미터 조회
   */
  getParams(): BKTParams {
    return { ...this.params };
  }
}

/**
 * 학습 경로 추천 시스템
 */
export interface LearningRecommendation {
  componentId: string;
  componentName: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  recommendedDifficulty: 'easy' | 'medium' | 'hard' | 'expert';
  estimatedMasteryTime: number; // 분 단위
}

export function generateLearningRecommendations(
  knowledgeStates: KnowledgeState[],
  bktEngine: BKTEngine = new BKTEngine()
): LearningRecommendation[] {
  const recommendations: LearningRecommendation[] = [];

  for (const state of knowledgeStates) {
    const isMastered = bktEngine.isMastered(state.pKnown);
    const needsReview = bktEngine.needsReview(state.pKnown, new Date(state.lastUpdated));
    const recommendedDifficulty = bktEngine.recommendDifficulty(state.pKnown);

    if (isMastered && !needsReview) {
      // 마스터리 달성 및 복습 불필요
      continue;
    }

    let priority: 'high' | 'medium' | 'low';
    let reason: string;

    if (needsReview) {
      priority = 'high';
      reason = '복습이 필요합니다. 시간이 지나면서 기억이 감소했을 수 있습니다.';
    } else if (state.pKnown < 0.3) {
      priority = 'high';
      reason = '이 개념의 이해도가 낮습니다. 기초부터 다시 학습하세요.';
    } else if (state.pKnown < 0.6) {
      priority = 'medium';
      reason = '이 개념을 더 연습하면 좋겠습니다.';
    } else {
      priority = 'low';
      reason = '거의 마스터했습니다. 조금 더 연습하면 완벽해집니다.';
    }

    // 예상 마스터리 달성 시간 계산 (간단한 추정)
    const remainingToMastery = 0.95 - state.pKnown;
    const avgLearningPerSession = 0.1; // 한 세션당 평균 10% 상승
    const estimatedSessions = Math.ceil(remainingToMastery / avgLearningPerSession);
    const estimatedMasteryTime = estimatedSessions * 15; // 세션당 15분

    recommendations.push({
      componentId: state.componentId,
      componentName: state.componentName,
      priority,
      reason,
      recommendedDifficulty,
      estimatedMasteryTime,
    });
  }

  // 우선순위에 따라 정렬
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

/**
 * 적응형 퀴즈 생성을 위한 문제 선택
 */
export interface QuestionSelection {
  componentId: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  weight: number; // 선택 가중치
}

export function selectQuestionsForAdaptiveQuiz(
  knowledgeStates: KnowledgeState[],
  numQuestions: number,
  bktEngine: BKTEngine = new BKTEngine()
): QuestionSelection[] {
  const selections: QuestionSelection[] = [];

  // 각 지식 컴포넌트에 대한 가중치 계산
  const weights = knowledgeStates.map(state => {
    // 낮은 지식 확률에 더 높은 가중치 부여
    const knowledgeWeight = 1 - state.pKnown;

    // 시도 횟수가 적은 것에 더 높은 가중치
    const attemptWeight = 1 / (state.attempts + 1);

    // 최근에 업데이트되지 않은 것에 더 높은 가중치
    const daysSinceUpdate = (Date.now() - new Date(state.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
    const recencyWeight = Math.min(1, daysSinceUpdate / 7); // 최대 7일

    // 종합 가중치
    const totalWeight = knowledgeWeight * 0.5 + attemptWeight * 0.3 + recencyWeight * 0.2;

    return {
      state,
      weight: totalWeight,
    };
  });

  // 가중치에 따라 정렬
  weights.sort((a, b) => b.weight - a.weight);

  // 상위 N개 선택
  const selected = weights.slice(0, numQuestions);

  for (const item of selected) {
    selections.push({
      componentId: item.state.componentId,
      difficulty: bktEngine.recommendDifficulty(item.state.pKnown),
      weight: item.weight,
    });
  }

  return selections;
}

export default BKTEngine;
