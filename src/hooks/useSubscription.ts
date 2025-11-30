'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { PlanType, SUBSCRIPTION_PLANS } from '@/types/subscription';

export function useSubscription() {
  const { data: session, status } = useSession();

  const subscription = useMemo(() => {
    if (status !== 'authenticated' || !session?.user?.subscription) {
      return {
        planId: 'free' as PlanType,
        status: 'active',
        isActive: false,
        isPro: false,
        isProPlus: false,
        isEnterprise: false,
        isFree: true,
      };
    }

    const { planId, status: subStatus } = session.user.subscription;
    const isActive = subStatus === 'ACTIVE';

    return {
      planId: planId as PlanType,
      status: subStatus,
      isActive,
      isPro: isActive && planId === 'pro',
      isProPlus: isActive && planId === 'pro_plus',
      isEnterprise: isActive && planId === 'enterprise',
      isFree: planId === 'free' || !isActive,
      hasPremiumAccess: isActive && ['pro', 'pro_plus', 'enterprise'].includes(planId),
    };
  }, [session, status]);

  const currentPlan = useMemo(() => {
    return SUBSCRIPTION_PLANS.find(p => p.id === subscription.planId) || SUBSCRIPTION_PLANS[0];
  }, [subscription.planId]);

  return {
    ...subscription,
    currentPlan,
    isLoading: status === 'loading',
  };
}
