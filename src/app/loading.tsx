import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="relative inline-block">
          <span className="text-5xl animate-pulse">🔥</span>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>로딩 중...</span>
        </div>
      </div>
    </div>
  );
}
