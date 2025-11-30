'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<any>;
  loadPackage: (packages: string | string[]) => Promise<void>;
  globals: any;
  runPython: (code: string) => any;
}

declare global {
  interface Window {
    loadPyodide: () => Promise<PyodideInterface>;
  }
}

export function usePyodide() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pyodideRef = useRef<PyodideInterface | null>(null);
  const outputRef = useRef<string[]>([]);

  useEffect(() => {
    let mounted = true;

    const initPyodide = async () => {
      try {
        // Pyodide CDN 스크립트 로드
        if (!window.loadPyodide) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
          script.async = true;

          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Pyodide'));
            document.head.appendChild(script);
          });
        }

        // Pyodide 인스턴스 초기화
        const pyodide = await window.loadPyodide();

        // stdout/stderr 캡처 설정
        await pyodide.runPythonAsync(`
import sys
from io import StringIO

class OutputCapture:
    def __init__(self):
        self.outputs = []

    def write(self, text):
        if text.strip():
            self.outputs.append(text)

    def flush(self):
        pass

    def get_output(self):
        result = ''.join(self.outputs)
        self.outputs = []
        return result

_output_capture = OutputCapture()
sys.stdout = _output_capture
sys.stderr = _output_capture
        `);

        if (mounted) {
          pyodideRef.current = pyodide;
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize Pyodide');
          setIsLoading(false);
        }
      }
    };

    initPyodide();

    return () => {
      mounted = false;
    };
  }, []);

  const runPython = useCallback(async (code: string): Promise<{ output: string; error: string | null; result: any }> => {
    if (!pyodideRef.current) {
      return { output: '', error: 'Pyodide not initialized', result: null };
    }

    try {
      const pyodide = pyodideRef.current;

      // 코드 실행
      const result = await pyodide.runPythonAsync(code);

      // 캡처된 출력 가져오기
      const output = await pyodide.runPythonAsync('_output_capture.get_output()');

      return { output: output || '', error: null, result };
    } catch (err) {
      // 캡처된 출력 가져오기 (에러 발생 시에도)
      let output = '';
      try {
        output = await pyodideRef.current.runPythonAsync('_output_capture.get_output()');
      } catch {}

      return {
        output,
        error: err instanceof Error ? err.message : String(err),
        result: null,
      };
    }
  }, []);

  const runPythonWithTests = useCallback(async (
    code: string,
    testCases: Array<{ input: string; expectedOutput: string }>
  ): Promise<{
    results: Array<{
      input: string;
      expectedOutput: string;
      actualOutput: string;
      passed: boolean;
    }>;
    error: string | null;
  }> => {
    if (!pyodideRef.current) {
      return { results: [], error: 'Pyodide not initialized' };
    }

    const results = [];

    try {
      const pyodide = pyodideRef.current;

      // 사용자 코드 실행 (함수 정의)
      await pyodide.runPythonAsync(code);

      for (const testCase of testCases) {
        try {
          // 테스트 입력 설정 및 실행
          const testCode = `
_output_capture.outputs = []
${testCase.input}
_output_capture.get_output()
`;
          const actualOutput = await pyodide.runPythonAsync(testCode);
          const trimmedActual = String(actualOutput || '').trim();
          const trimmedExpected = testCase.expectedOutput.trim();

          results.push({
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: trimmedActual,
            passed: trimmedActual === trimmedExpected,
          });
        } catch (err) {
          results.push({
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: err instanceof Error ? err.message : String(err),
            passed: false,
          });
        }
      }

      return { results, error: null };
    } catch (err) {
      return {
        results,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }, []);

  return {
    isLoading,
    error,
    runPython,
    runPythonWithTests,
    isReady: !isLoading && !error && pyodideRef.current !== null,
  };
}
