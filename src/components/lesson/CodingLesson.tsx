'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, RotateCcw, Lightbulb, CheckCircle2, XCircle, Loader2, Terminal } from 'lucide-react';
import { usePyodide } from '@/hooks/usePyodide';

// Monaco Editor를 동적으로 로드 (SSR 비활성화)
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[300px] bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    ),
  }
);

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface TestResult {
  id: string;
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string;
}

interface CodingLessonProps {
  content: {
    language?: 'python' | 'javascript' | 'sql';
    initialCode?: string;
    instructions?: string;
    testCases?: TestCase[];
    hints?: string[];
  };
  onComplete: (score: number) => void;
}

const languageMap: Record<string, string> = {
  python: 'python',
  javascript: 'javascript',
  sql: 'sql',
};

export function CodingLesson({ content, onComplete }: CodingLessonProps) {
  const language = content.language || 'python';
  const testCases = content.testCases || [];

  const [code, setCode] = useState(content.initialCode || getDefaultCode(language));
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [allTestsPassed, setAllTestsPassed] = useState(false);
  const [activeTab, setActiveTab] = useState('output');

  const { isLoading: isPyodideLoading, error: pyodideError, runPython, isReady } = usePyodide();

  // 키보드 단축키 (Ctrl/Cmd + Enter로 실행)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isRunning && isReady) {
          runCode();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, isReady, code]);

  const runCode = async () => {
    if (!isReady && language === 'python') {
      setOutput('Python 환경을 초기화하는 중입니다. 잠시만 기다려주세요...');
      return;
    }

    setIsRunning(true);
    setOutput('');
    setTestResults([]);

    try {
      if (language === 'python') {
        // Python 코드 실행 (Pyodide 사용)
        const { output: pythonOutput, error, result } = await runPython(code);

        if (error) {
          setOutput(`오류:\n${error}`);
        } else {
          let displayOutput = pythonOutput || '';
          if (result !== undefined && result !== null) {
            displayOutput += (displayOutput ? '\n' : '') + `결과: ${result}`;
          }
          setOutput(displayOutput || '(출력 없음)');
        }

        // 테스트 케이스 실행
        if (testCases.length > 0) {
          const results: TestResult[] = [];

          for (const tc of testCases) {
            try {
              // 각 테스트 케이스에 대해 코드 실행
              const testCode = `${code}\n\n# Test execution\n${tc.input}`;
              const { output: testOutput, error: testError, result: testResult } = await runPython(testCode);

              let actualOutput = '';
              if (testError) {
                actualOutput = testError;
              } else if (testOutput) {
                actualOutput = testOutput.trim();
              } else if (testResult !== undefined && testResult !== null) {
                actualOutput = String(testResult);
              }

              const passed = actualOutput.trim() === tc.expectedOutput.trim();

              results.push({
                id: tc.id,
                passed,
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                actualOutput: tc.isHidden ? (passed ? '통과' : '실패') : actualOutput,
              });
            } catch (err) {
              results.push({
                id: tc.id,
                passed: false,
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                actualOutput: tc.isHidden ? '실패' : String(err),
              });
            }
          }

          setTestResults(results);
          setActiveTab('tests');

          const allPassed = results.every(r => r.passed);
          setAllTestsPassed(allPassed);

          if (allPassed) {
            const score = 100;
            onComplete(score);
          }
        }
      } else if (language === 'javascript') {
        // JavaScript 실행 (브라우저 내장)
        try {
          const logs: string[] = [];
          const originalLog = console.log;
          console.log = (...args) => {
            logs.push(args.map(arg =>
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
          };

          const result = eval(code);
          console.log = originalLog;

          let displayOutput = logs.join('\n');
          if (result !== undefined) {
            displayOutput += (displayOutput ? '\n' : '') + `결과: ${result}`;
          }
          setOutput(displayOutput || '(출력 없음)');
        } catch (err) {
          setOutput(`오류:\n${err instanceof Error ? err.message : String(err)}`);
        }

        // JavaScript 테스트 케이스
        if (testCases.length > 0) {
          const results: TestResult[] = testCases.map(tc => {
            try {
              const testCode = `${code}\n${tc.input}`;
              const actualOutput = String(eval(testCode));
              const passed = actualOutput.trim() === tc.expectedOutput.trim();

              return {
                id: tc.id,
                passed,
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                actualOutput: tc.isHidden ? (passed ? '통과' : '실패') : actualOutput,
              };
            } catch (err) {
              return {
                id: tc.id,
                passed: false,
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                actualOutput: tc.isHidden ? '실패' : String(err),
              };
            }
          });

          setTestResults(results);
          setActiveTab('tests');

          const allPassed = results.every(r => r.passed);
          setAllTestsPassed(allPassed);

          if (allPassed) {
            onComplete(100);
          }
        }
      } else {
        // SQL 등 지원하지 않는 언어
        setOutput('이 언어는 현재 브라우저에서 직접 실행할 수 없습니다.\n서버 사이드 실행이 필요합니다.');
      }
    } catch (error) {
      setOutput('오류가 발생했습니다: ' + String(error));
    } finally {
      setIsRunning(false);
    }
  };

  const resetCode = () => {
    setCode(content.initialCode || getDefaultCode(language));
    setOutput('');
    setTestResults([]);
    setAllTestsPassed(false);
  };

  const showNextHint = () => {
    setShowHint(true);
    if (content.hints && currentHintIndex < content.hints.length - 1) {
      setCurrentHintIndex(prev => prev + 1);
    }
  };

  const handleEditorChange = useCallback((value: string | undefined) => {
    setCode(value || '');
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left: Editor */}
      <div className="space-y-4">
        {/* Instructions */}
        {content.instructions && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">문제 설명</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: content.instructions }}
              />
            </CardContent>
          </Card>
        )}

        {/* Code Editor */}
        <Card>
          <CardHeader className="py-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              <CardTitle className="text-sm uppercase">{language}</CardTitle>
              {language === 'python' && (
                <span className={`text-xs px-2 py-0.5 rounded ${
                  isPyodideLoading ? 'bg-yellow-100 text-yellow-700' :
                  pyodideError ? 'bg-red-100 text-red-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {isPyodideLoading ? '로딩 중...' : pyodideError ? '오류' : '준비됨'}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {content.hints && content.hints.length > 0 && (
                <Button variant="outline" size="sm" onClick={showNextHint}>
                  <Lightbulb className="h-4 w-4 mr-1" />
                  힌트
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={resetCode}>
                <RotateCcw className="h-4 w-4 mr-1" />
                초기화
              </Button>
              <Button
                size="sm"
                onClick={runCode}
                disabled={isRunning || (language === 'python' && !isReady)}
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span className="ml-1">실행</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <MonacoEditor
              height="300px"
              language={languageMap[language]}
              theme="vs-dark"
              value={code}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: 'on',
                padding: { top: 10, bottom: 10 },
              }}
            />
          </CardContent>
        </Card>

        {/* Keyboard Shortcut Hint */}
        <p className="text-xs text-muted-foreground text-center">
          Ctrl/Cmd + Enter로 코드 실행
        </p>

        {/* Hint */}
        {showHint && content.hints && content.hints.length > 0 && (
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
            <CardContent className="py-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    힌트 {currentHintIndex + 1}/{content.hints.length}
                  </p>
                  <p className="text-sm">{content.hints[currentHintIndex]}</p>
                  {currentHintIndex < content.hints.length - 1 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-blue-600"
                      onClick={showNextHint}
                    >
                      다음 힌트 보기
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right: Output & Tests */}
      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="output" className="flex-1">출력</TabsTrigger>
            <TabsTrigger value="tests" className="flex-1">
              테스트
              {testResults.length > 0 && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  allTestsPassed
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {testResults.filter(r => r.passed).length}/{testResults.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="output" className="mt-2">
            <Card>
              <CardContent className="p-0">
                <pre className="p-4 h-[400px] overflow-auto bg-gray-900 text-gray-100 rounded-lg font-mono text-sm whitespace-pre-wrap">
                  {isRunning ? (
                    <span className="flex items-center gap-2 text-gray-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      실행 중...
                    </span>
                  ) : output || '코드를 실행하면 결과가 여기에 표시됩니다.'}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests" className="mt-2">
            <Card>
              <CardContent className="p-4 space-y-3 max-h-[400px] overflow-auto">
                {testCases.length === 0 ? (
                  <p className="text-muted-foreground text-sm">테스트 케이스가 없습니다.</p>
                ) : testResults.length === 0 ? (
                  <p className="text-muted-foreground text-sm">코드를 실행하면 테스트 결과가 표시됩니다.</p>
                ) : (
                  testResults.map((result, index) => (
                    <div
                      key={result.id}
                      className={`p-3 rounded-lg border ${
                        result.passed
                          ? 'bg-green-50 border-green-200 dark:bg-green-900/20'
                          : 'bg-red-50 border-red-200 dark:bg-red-900/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {result.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium text-sm">
                          테스트 {index + 1}
                        </span>
                      </div>
                      {!testCases[index]?.isHidden && (
                        <div className="text-xs font-mono space-y-1">
                          <p><span className="text-muted-foreground">입력:</span> {result.input}</p>
                          <p><span className="text-muted-foreground">예상:</span> {result.expectedOutput}</p>
                          <p><span className="text-muted-foreground">결과:</span> {result.actualOutput}</p>
                        </div>
                      )}
                      {testCases[index]?.isHidden && (
                        <p className="text-xs text-muted-foreground">
                          (숨겨진 테스트 케이스)
                        </p>
                      )}
                    </div>
                  ))
                )}

                {allTestsPassed && (
                  <div className="text-center py-4">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="font-medium text-green-700">모든 테스트를 통과했습니다!</p>
                    <p className="text-sm text-muted-foreground">+100 XP</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function getDefaultCode(language: string): string {
  switch (language) {
    case 'python':
      return `# 여기에 코드를 작성하세요

def solution(n):
    """
    주어진 문제를 해결하는 함수입니다.
    """
    pass

# 테스트
print(solution(10))
`;
    case 'javascript':
      return `// 여기에 코드를 작성하세요

function solution(n) {
  // 코드를 작성하세요

}

// 테스트
console.log(solution(10));
`;
    case 'sql':
      return `-- 여기에 SQL 쿼리를 작성하세요

SELECT * FROM table_name
WHERE condition = true;
`;
    default:
      return '';
  }
}
