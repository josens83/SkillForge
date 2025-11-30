import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 강사 생성
  const instructors = await Promise.all([
    prisma.instructor.upsert({
      where: { id: 'instructor-1' },
      update: {},
      create: {
        id: 'instructor-1',
        name: '김개발',
        avatar: '/instructors/kim.png',
        bio: '10년차 백엔드 개발자. 삼성, 네이버에서 근무. Python과 데이터 분석 전문가.',
        expertise: ['Python', 'Django', 'Data Analysis', 'Machine Learning'],
      },
    }),
    prisma.instructor.upsert({
      where: { id: 'instructor-2' },
      update: {},
      create: {
        id: 'instructor-2',
        name: 'Sarah Johnson',
        avatar: '/instructors/sarah.png',
        bio: 'Native English speaker with 8 years of business English teaching experience.',
        expertise: ['Business English', 'TOEIC', 'Presentation Skills'],
      },
    }),
    prisma.instructor.upsert({
      where: { id: 'instructor-3' },
      update: {},
      create: {
        id: 'instructor-3',
        name: '박데이터',
        avatar: '/instructors/park.png',
        bio: 'SQLD, 정보처리기사 자격증 보유. 대기업 DBA 경력 15년.',
        expertise: ['SQL', 'Database', 'SQLD', 'Oracle'],
      },
    }),
  ]);

  // 스킬 생성
  const skills = await Promise.all([
    prisma.skill.upsert({
      where: { id: 'skill-python' },
      update: {},
      create: {
        id: 'skill-python',
        category: 'programming',
        name: 'Python 기초',
        description: '프로그래밍 입문자를 위한 Python 기초 과정입니다. 변수, 조건문, 반복문부터 함수, 클래스까지 체계적으로 학습합니다.',
        icon: '🐍',
        difficulty: 'BEGINNER',
        estimatedHours: 20,
        prerequisites: [],
      },
    }),
    prisma.skill.upsert({
      where: { id: 'skill-english' },
      update: {},
      create: {
        id: 'skill-english',
        category: 'language',
        name: '비즈니스 영어 회화',
        description: '실무에서 바로 사용할 수 있는 비즈니스 영어 회화를 학습합니다. 이메일, 회의, 프레젠테이션 영어를 마스터하세요.',
        icon: '🌎',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 40,
        prerequisites: [],
      },
    }),
    prisma.skill.upsert({
      where: { id: 'skill-sqld' },
      update: {},
      create: {
        id: 'skill-sqld',
        category: 'certification',
        name: 'SQLD 자격증',
        description: 'SQL 개발자 자격증 취득을 위한 완벽 대비 과정입니다. 데이터 모델링부터 SQL 활용까지.',
        icon: '📊',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 30,
        prerequisites: [],
      },
    }),
    prisma.skill.upsert({
      where: { id: 'skill-javascript' },
      update: {},
      create: {
        id: 'skill-javascript',
        category: 'programming',
        name: 'JavaScript 기초',
        description: '웹 개발의 핵심 언어 JavaScript를 배웁니다. DOM 조작부터 비동기 처리까지.',
        icon: '⚡',
        difficulty: 'BEGINNER',
        estimatedHours: 25,
        prerequisites: [],
      },
    }),
  ]);

  // Python 기초 코스 생성
  const pythonCourse = await prisma.course.upsert({
    where: { id: 'course-python-basics' },
    update: {},
    create: {
      id: 'course-python-basics',
      skillId: 'skill-python',
      title: 'Python 기초 마스터',
      description: '프로그래밍을 처음 시작하는 분들을 위한 Python 입문 과정입니다. AI 튜터와 함께 코딩의 기초를 탄탄히 다져보세요.',
      thumbnail: '/courses/python-basics.jpg',
      totalLessons: 15,
      totalDuration: 300,
      instructorId: 'instructor-1',
      rating: 4.8,
      ratingCount: 1250,
      enrollments: 5420,
      accessType: 'FREE',
      published: true,
    },
  });

  // Python 코스 챕터 및 레슨 생성
  const pythonChapters = [
    {
      id: 'chapter-python-1',
      title: 'Python 시작하기',
      order: 1,
      lessons: [
        {
          id: 'lesson-python-1-1',
          title: 'Python 소개와 설치',
          type: 'VIDEO',
          duration: 15,
          order: 1,
          content: {
            videoUrl: '/videos/python-intro.mp4',
            description: 'Python의 역사와 특징을 알아보고, 개발 환경을 설정합니다.',
          },
        },
        {
          id: 'lesson-python-1-2',
          title: '첫 번째 Python 프로그램',
          type: 'ARTICLE',
          duration: 10,
          order: 2,
          content: {
            articleContent: `
              <h2>Hello, World!</h2>
              <p>Python에서 가장 간단한 프로그램을 만들어봅시다.</p>
              <pre><code>print("Hello, World!")</code></pre>
              <p>이 코드를 실행하면 화면에 "Hello, World!"가 출력됩니다.</p>
              <h3>print() 함수</h3>
              <p>print()는 Python의 내장 함수로, 괄호 안의 내용을 화면에 출력합니다.</p>
            `,
            readingTime: 5,
          },
        },
        {
          id: 'lesson-python-1-3',
          title: 'AI 튜터와 Python 대화하기',
          type: 'AI_CONVERSATION',
          duration: 20,
          order: 3,
          content: {
            tutorId: 'maya',
            topic: 'Python 기초 개념',
            objectives: [
              'Python의 장점 이해하기',
              'print() 함수 사용법 익히기',
              '간단한 코드 작성해보기',
            ],
            minMessages: 5,
          },
        },
      ],
    },
    {
      id: 'chapter-python-2',
      title: '변수와 자료형',
      order: 2,
      lessons: [
        {
          id: 'lesson-python-2-1',
          title: '변수란 무엇인가?',
          type: 'VIDEO',
          duration: 20,
          order: 1,
          content: {
            videoUrl: '/videos/python-variables.mp4',
            description: '변수의 개념과 사용법을 배웁니다.',
          },
        },
        {
          id: 'lesson-python-2-2',
          title: '숫자와 문자열',
          type: 'ARTICLE',
          duration: 15,
          order: 2,
          content: {
            articleContent: `
              <h2>Python의 기본 자료형</h2>
              <h3>숫자형 (Numbers)</h3>
              <p>Python에서는 정수(int)와 실수(float)를 다룰 수 있습니다.</p>
              <pre><code>
age = 25        # 정수
height = 175.5  # 실수
              </code></pre>
              <h3>문자열 (String)</h3>
              <p>문자열은 따옴표로 감싸서 표현합니다.</p>
              <pre><code>
name = "홍길동"
message = 'Hello, Python!'
              </code></pre>
            `,
            readingTime: 8,
          },
        },
        {
          id: 'lesson-python-2-3',
          title: '변수 활용 퀴즈',
          type: 'QUIZ',
          duration: 10,
          order: 3,
          content: {
            questions: [
              {
                id: 'q1',
                question: 'Python에서 변수에 값을 할당하는 올바른 방법은?',
                options: ['x == 10', 'x = 10', 'x := 10', 'let x = 10'],
                correctAnswer: 1,
                explanation: 'Python에서는 = 기호를 사용하여 변수에 값을 할당합니다.',
              },
              {
                id: 'q2',
                question: '다음 중 문자열이 아닌 것은?',
                options: ['"Hello"', "'World'", '123', '"""Text"""'],
                correctAnswer: 2,
                explanation: '123은 따옴표로 감싸지 않았으므로 숫자(정수)입니다.',
              },
              {
                id: 'q3',
                question: 'print(type(3.14))의 출력 결과는?',
                options: ["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'number'>"],
                correctAnswer: 1,
                explanation: '3.14는 소수점이 있는 실수이므로 float 타입입니다.',
              },
            ],
            passingScore: 70,
          },
        },
        {
          id: 'lesson-python-2-4',
          title: '변수 실습',
          type: 'CODING_EXERCISE',
          duration: 25,
          order: 4,
          content: {
            language: 'python',
            instructions: `
              <h3>문제</h3>
              <p>두 변수 a와 b에 저장된 값을 교환하는 코드를 작성하세요.</p>
              <p>예를 들어, a=5, b=10이면 실행 후 a=10, b=5가 되어야 합니다.</p>
            `,
            initialCode: '# 변수 초기화\na = 5\nb = 10\n\n# 여기에 값을 교환하는 코드를 작성하세요\n\n\n# 결과 출력\nprint(f"a = {a}, b = {b}")',
            testCases: [
              { id: 't1', input: 'a=5, b=10', expectedOutput: 'a = 10, b = 5', isHidden: false },
              { id: 't2', input: 'a=1, b=2', expectedOutput: 'a = 2, b = 1', isHidden: true },
            ],
            hints: [
              '임시 변수를 사용해보세요.',
              'temp = a 로 a의 값을 임시 저장할 수 있습니다.',
              'Python에서는 a, b = b, a 로 한 줄에 교환할 수도 있습니다.',
            ],
          },
        },
      ],
    },
    {
      id: 'chapter-python-3',
      title: '조건문과 반복문',
      order: 3,
      lessons: [
        {
          id: 'lesson-python-3-1',
          title: 'if 조건문',
          type: 'VIDEO',
          duration: 25,
          order: 1,
          content: {
            videoUrl: '/videos/python-if.mp4',
            description: '조건에 따라 다른 코드를 실행하는 if문을 배웁니다.',
          },
        },
        {
          id: 'lesson-python-3-2',
          title: 'for와 while 반복문',
          type: 'ARTICLE',
          duration: 20,
          order: 2,
          content: {
            articleContent: `
              <h2>반복문</h2>
              <h3>for 문</h3>
              <pre><code>
for i in range(5):
    print(i)  # 0, 1, 2, 3, 4 출력
              </code></pre>
              <h3>while 문</h3>
              <pre><code>
count = 0
while count < 5:
    print(count)
    count += 1
              </code></pre>
            `,
            readingTime: 10,
          },
        },
      ],
    },
  ];

  for (const chapterData of pythonChapters) {
    const chapter = await prisma.chapter.upsert({
      where: { id: chapterData.id },
      update: {},
      create: {
        id: chapterData.id,
        courseId: pythonCourse.id,
        title: chapterData.title,
        order: chapterData.order,
      },
    });

    for (const lessonData of chapterData.lessons) {
      await prisma.lesson.upsert({
        where: { id: lessonData.id },
        update: {},
        create: {
          id: lessonData.id,
          chapterId: chapter.id,
          title: lessonData.title,
          type: lessonData.type as any,
          duration: lessonData.duration,
          order: lessonData.order,
          content: lessonData.content,
          aiTutorEnabled: true,
        },
      });
    }
  }

  // 비즈니스 영어 코스 생성
  const englishCourse = await prisma.course.upsert({
    where: { id: 'course-business-english' },
    update: {},
    create: {
      id: 'course-business-english',
      skillId: 'skill-english',
      title: '비즈니스 영어 회화 마스터',
      description: '글로벌 비즈니스 환경에서 자신있게 영어로 소통하세요. AI 튜터와 실전 회화 연습!',
      thumbnail: '/courses/business-english.jpg',
      totalLessons: 20,
      totalDuration: 480,
      instructorId: 'instructor-2',
      rating: 4.9,
      ratingCount: 890,
      enrollments: 3210,
      accessType: 'PREMIUM',
      published: true,
    },
  });

  // SQLD 코스 생성
  const sqldCourse = await prisma.course.upsert({
    where: { id: 'course-sqld' },
    update: {},
    create: {
      id: 'course-sqld',
      skillId: 'skill-sqld',
      title: 'SQLD 자격증 완벽 대비',
      description: 'SQL 개발자 자격증 합격을 위한 체계적인 학습 과정. 이론부터 실전 문제까지!',
      thumbnail: '/courses/sqld.jpg',
      totalLessons: 30,
      totalDuration: 600,
      instructorId: 'instructor-3',
      rating: 4.7,
      ratingCount: 560,
      enrollments: 1890,
      accessType: 'PURCHASE',
      price: 99000,
      priceType: 'certification',
      published: true,
    },
  });

  // 성취 배지 생성
  const achievements = await Promise.all([
    prisma.achievement.upsert({
      where: { id: 'achievement-first-lesson' },
      update: {},
      create: {
        id: 'achievement-first-lesson',
        name: '첫 걸음',
        description: '첫 번째 레슨을 완료했습니다!',
        icon: '🎯',
        rarity: 'common',
        xpReward: 50,
        criteria: { type: 'lessons_completed', count: 1 },
      },
    }),
    prisma.achievement.upsert({
      where: { id: 'achievement-streak-7' },
      update: {},
      create: {
        id: 'achievement-streak-7',
        name: '일주일 연속 학습',
        description: '7일 연속으로 학습했습니다!',
        icon: '🔥',
        rarity: 'rare',
        xpReward: 200,
        criteria: { type: 'streak', days: 7 },
      },
    }),
    prisma.achievement.upsert({
      where: { id: 'achievement-quiz-master' },
      update: {},
      create: {
        id: 'achievement-quiz-master',
        name: '퀴즈 마스터',
        description: '퀴즈에서 100점을 획득했습니다!',
        icon: '🏆',
        rarity: 'epic',
        xpReward: 300,
        criteria: { type: 'quiz_perfect', count: 1 },
      },
    }),
    prisma.achievement.upsert({
      where: { id: 'achievement-course-complete' },
      update: {},
      create: {
        id: 'achievement-course-complete',
        name: '코스 정복자',
        description: '코스를 완료했습니다!',
        icon: '👑',
        rarity: 'legendary',
        xpReward: 500,
        criteria: { type: 'course_completed', count: 1 },
      },
    }),
  ]);

  console.log('Seeding completed!');
  console.log(`Created ${instructors.length} instructors`);
  console.log(`Created ${skills.length} skills`);
  console.log(`Created 3 courses`);
  console.log(`Created ${achievements.length} achievements`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
