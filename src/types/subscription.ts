// 구독 플랜 타입
export type PlanType = 'free' | 'pro' | 'pro_plus' | 'enterprise';
export type BillingCycle = 'monthly' | 'yearly';

export interface SubscriptionPlan {
  id: PlanType;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  limitations?: string[];
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  popular?: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: PlanType;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'trialing'
  | 'unpaid';

// 구독 플랜 정의
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: '무료 체험',
    description: '기본 기능을 무료로 체험해보세요',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      '레슨 3개/일 무료',
      '기본 AI 튜터 (텍스트만)',
      '커뮤니티 접근',
      '기본 진도 트래킹',
    ],
    limitations: [
      '광고 포함',
      '음성 대화 제한',
      '코딩 실습 5회/일',
      '자격증 모의고사 미지원',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: '본격적인 학습을 위한 프리미엄 플랜',
    monthlyPrice: 9900,
    yearlyPrice: 79000,
    features: [
      '모든 코스 무제한 접근',
      'AI 튜터 음성 대화',
      '무제한 코딩 실습',
      '상세 학습 분석',
      'AI 맞춤 학습 경로',
      '광고 제거',
      '오프라인 학습',
      '자격증 모의고사 월 5회',
      '우선 고객 지원',
    ],
    popular: true,
  },
  {
    id: 'pro_plus',
    name: 'Pro+',
    description: '전문가 수준의 학습과 커리어 지원',
    monthlyPrice: 19900,
    yearlyPrice: 159000,
    features: [
      'Pro의 모든 기능',
      '1:1 실시간 튜터 세션 월 2회',
      '자격증 모의고사 무제한',
      '이력서/포트폴리오 리뷰',
      '취업 커리어 상담',
      'Slack 커뮤니티 접근',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: '기업 맞춤 솔루션',
    monthlyPrice: 0,  // 별도 문의
    yearlyPrice: 0,
    features: [
      'Pro+의 모든 기능',
      '팀 관리 대시보드',
      '맞춤 학습 경로 설계',
      '진도 관리/리포팅',
      'SSO/SAML 연동',
      '전담 계정 매니저',
      'API 접근',
    ],
  },
];

// 코스 개별 구매 가격
export interface CoursePricing {
  type: 'mini' | 'standard' | 'comprehensive' | 'certification';
  basePrice: number;
  proDiscount: number;  // 0-1
  includes?: string[];
}

export const COURSE_PRICING: Record<string, CoursePricing> = {
  mini: {
    type: 'mini',
    basePrice: 19900,
    proDiscount: 0.5,
  },
  standard: {
    type: 'standard',
    basePrice: 49900,
    proDiscount: 0.5,
  },
  comprehensive: {
    type: 'comprehensive',
    basePrice: 99000,
    proDiscount: 0.5,
  },
  certification: {
    type: 'certification',
    basePrice: 149000,
    proDiscount: 0.3,
    includes: ['교재 PDF', '모의고사 10회', '합격 보장'],
  },
};

// 쿠폰/프로모션
export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  validFrom: Date;
  validUntil: Date;
  maxUses: number;
  currentUses: number;
  applicablePlans?: PlanType[];
  applicableCourses?: string[];
  minPurchaseAmount?: number;
}

// 결제 내역
export interface PaymentHistory {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  type: 'subscription' | 'course' | 'exam';
  description: string;
  createdAt: Date;
  stripePaymentIntentId?: string;
  receiptUrl?: string;
}

// 헬퍼 함수
export function getPlanByType(planType: PlanType): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planType);
}

export function calculateYearlyDiscount(plan: SubscriptionPlan): number {
  if (plan.monthlyPrice === 0) return 0;
  const yearlyMonthly = plan.yearlyPrice / 12;
  return Math.round((1 - yearlyMonthly / plan.monthlyPrice) * 100);
}

export function formatPrice(price: number, currency: string = 'KRW'): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(price);
}
