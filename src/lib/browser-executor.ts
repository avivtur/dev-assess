type ExecutionResult = {
  success: boolean;
  output: string;
};

const EXECUTION_TIMEOUT_MS = 10_000;

const BROWSER_LANGUAGES = new Set(['javascript', 'typescript', 'python']);

export function canRunInBrowser(language: string): boolean {
  return BROWSER_LANGUAGES.has(language);
}

export async function runInBrowser(
  language: string,
  code: string,
): Promise<ExecutionResult> {
  switch (language) {
    case 'javascript':
      return runJavaScript(code);
    case 'typescript':
      return runTypeScript(code);
    case 'python':
      return runPython(code);
    default:
      return { success: false, output: `Browser execution not supported for ${language}` };
  }
}

function runJavaScript(code: string): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    const worker = new Worker('/workers/js-executor.js');

    const timer = setTimeout(() => {
      worker.terminate();
      resolve({ success: false, output: 'Execution timed out (10s limit)' });
    }, EXECUTION_TIMEOUT_MS);

    worker.onmessage = (e: MessageEvent<ExecutionResult>) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(e.data);
    };

    worker.onerror = (err) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ success: false, output: `Worker error: ${err.message}` });
    };

    worker.postMessage(code);
  });
}

async function runTypeScript(code: string): Promise<ExecutionResult> {
  try {
    const ts = await loadTypeScriptCompiler();
    const jsCode = ts.transpile(code, {
      target: ts.ScriptTarget.ES2017,
      module: ts.ModuleKind.None,
    });
    return runJavaScript(jsCode);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, output: `TypeScript compilation error:\n${msg}` };
  }
}

type TypeScriptApi = {
  transpile: (
    input: string,
    compilerOptions?: { target?: number; module?: number },
  ) => string;
  ScriptTarget: { ES2017: number };
  ModuleKind: { None: number };
};

let tsCompiler: TypeScriptApi | null = null;

async function loadTypeScriptCompiler(): Promise<TypeScriptApi> {
  if (tsCompiler) return tsCompiler;

  await loadScript('https://cdn.jsdelivr.net/npm/typescript@5/lib/typescript.min.js');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tsCompiler = (globalThis as any).ts as TypeScriptApi;
  if (!tsCompiler) throw new Error('Failed to load TypeScript compiler');
  return tsCompiler;
}

type PyodideApi = {
  runPython: (code: string) => unknown;
};

let pyodideInstance: PyodideApi | null = null;

async function loadPyodideRuntime(): Promise<PyodideApi> {
  if (pyodideInstance) return pyodideInstance;

  await loadScript('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadPyodide = (globalThis as any).loadPyodide as (opts: {
    indexURL: string;
  }) => Promise<PyodideApi>;
  if (!loadPyodide) throw new Error('Failed to load Pyodide loader');

  pyodideInstance = await loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/',
  });
  return pyodideInstance;
}

async function runPython(code: string): Promise<ExecutionResult> {
  try {
    const pyodide = await loadPyodideRuntime();

    pyodide.runPython(`
import sys, io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
`);

    try {
      pyodide.runPython(code);
    } catch (pyErr) {
      const stderr = pyodide.runPython('sys.stderr.getvalue()') as string;
      const stdout = pyodide.runPython('sys.stdout.getvalue()') as string;
      const msg = pyErr instanceof Error ? pyErr.message : String(pyErr);
      const combined = [stdout, stderr, msg].filter(Boolean).join('\n');
      return { success: false, output: combined };
    }

    const stdout = pyodide.runPython('sys.stdout.getvalue()') as string;
    const stderr = pyodide.runPython('sys.stderr.getvalue()') as string;
    const output = [stdout, stderr].filter(Boolean).join('\n');
    return { success: true, output };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, output: `Python runtime error:\n${msg}` };
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}
