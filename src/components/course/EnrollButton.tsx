'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface EnrollButtonProps {
  courseId: string;
  accessType: string;
  price: number | null;
  hasAccess: boolean;
}

export function EnrollButton({ courseId, accessType, price, hasAccess }: EnrollButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/courses/${courseId}`);
      return;
    }

    if (accessType === 'PURCHASE' && !hasAccess) {
      // 구매 페이지로 이동
      router.push(`/courses/${courseId}/purchase`);
      return;
    }

    if (accessType === 'PREMIUM' && !hasAccess) {
      router.push('/pricing');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/learn/${courseId}`);
      } else {
        alert(data.error || '수강 등록에 실패했습니다.');
      }
    } catch (error) {
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (accessType === 'FREE') {
      return '무료로 시작하기';
    }
    if (accessType === 'PREMIUM') {
      return hasAccess ? '수강 시작하기' : 'Pro 회원 전용';
    }
    if (accessType === 'PURCHASE') {
      return hasAccess ? '수강 시작하기' : `${formatPrice(price || 0)}에 구매하기`;
    }
    return '수강 시작하기';
  };

  return (
    <Button
      className="w-full"
      onClick={handleEnroll}
      disabled={loading || (accessType === 'PREMIUM' && !hasAccess)}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          처리 중...
        </>
      ) : (
        getButtonText()
      )}
    </Button>
  );
}
