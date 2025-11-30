'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { formatDuration, formatPrice } from '@/lib/utils';
import { Search, Star, Users } from 'lucide-react';

const categories = [
  { id: 'all', name: '전체', icon: '📚' },
  { id: 'programming', name: '프로그래밍', icon: '💻' },
  { id: 'language', name: '외국어', icon: '🌎' },
  { id: 'certification', name: '자격증', icon: '📜' },
  { id: 'business', name: '비즈니스', icon: '💼' },
  { id: 'data', name: '데이터/AI', icon: '📊' },
];

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  totalLessons: number;
  totalDuration: number;
  rating: number;
  ratingCount: number;
  enrollments: number;
  accessType: string;
  price: number | null;
  skill: {
    id: string;
    name: string;
    category: string;
    icon: string;
    difficulty: string;
  };
  instructor: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
}

async function fetchCourses(category: string, page: number) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: '12',
  });

  if (category !== 'all') {
    params.set('category', category);
  }

  const response = await fetch(`/api/courses?${params}`);
  return response.json();
}

export default function CoursesPage() {
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['courses', category, page],
    queryFn: () => fetchCourses(category, page),
  });

  const courses: Course[] = data?.items || [];
  const totalPages = data?.totalPages || 1;

  const filteredCourses = search
    ? courses.filter(course =>
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.skill.name.toLowerCase().includes(search.toLowerCase())
      )
    : courses;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🔥</span>
            <span className="font-bold text-xl">SkillForge</span>
          </Link>
          <nav className="ml-auto flex items-center space-x-4">
            <Link href="/pricing" className="text-sm font-medium hover:text-primary">
              요금제
            </Link>
            <Link href="/dashboard">
              <Button size="sm">대시보드</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">코스 둘러보기</h1>
          <p className="text-muted-foreground">
            AI 튜터와 함께 다양한 스킬을 학습하세요
          </p>
        </div>

        {/* Search & Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="코스 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
            <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <span className="mr-1">{cat.icon}</span>
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Course Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">검색 결과가 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <span className="text-3xl">{course.skill.icon}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          course.accessType === 'FREE'
                            ? 'bg-green-100 text-green-700'
                            : course.accessType === 'PREMIUM'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {course.accessType === 'FREE' && '무료'}
                          {course.accessType === 'PREMIUM' && 'Pro 전용'}
                          {course.accessType === 'PURCHASE' && formatPrice(course.price || 0)}
                        </span>
                      </div>
                      <CardTitle className="text-lg mt-2">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {course.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{course.rating.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{course.enrollments.toLocaleString()}</span>
                        </div>
                        <span>{formatDuration(course.totalDuration)}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          course.skill.difficulty === 'BEGINNER'
                            ? 'bg-green-100 text-green-700'
                            : course.skill.difficulty === 'INTERMEDIATE'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {course.skill.difficulty === 'BEGINNER' && '입문'}
                          {course.skill.difficulty === 'INTERMEDIATE' && '중급'}
                          {course.skill.difficulty === 'ADVANCED' && '고급'}
                          {course.skill.difficulty === 'EXPERT' && '전문가'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {course.skill.name}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full">자세히 보기</Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  이전
                </Button>
                <span className="flex items-center px-4">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  다음
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
