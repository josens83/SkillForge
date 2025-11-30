import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function CoursesLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🔥</span>
            <span className="font-bold text-xl">SkillForge</span>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Title Section */}
        <div className="text-center mb-8">
          <Skeleton className="h-10 w-48 mx-auto mb-4" />
          <Skeleton className="h-4 w-72 mx-auto" />
        </div>

        {/* Filters Skeleton */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>

        {/* Course Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="p-0">
                <Skeleton className="h-48 w-full rounded-t-lg" />
              </CardHeader>
              <CardContent className="py-4">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-24 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
