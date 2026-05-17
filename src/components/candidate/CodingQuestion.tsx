'use client';

import {
  Button,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import { PlayIcon } from '@patternfly/react-icons';
import Editor from '@monaco-editor/react';
import { type FC, useState } from 'react';

import MarkdownRenderer from '@/components/common/MarkdownRenderer';

type CodingQuestionProps = {
  content: string;
  starterCode: string | null;
  allowedLanguages: string[] | null;
  answerContent: string;
  selectedLanguage: string;
  codeOutput: string;
  onCodeChange: (code: string) => void;
  onLanguageChange: (lang: string) => void;
  onOutputChange: (output: string) => void;
};

const LANGUAGE_TO_MONACO: Record<string, string> = {
  c: 'c',
  cpp: 'cpp',
  csharp: 'csharp',
  go: 'go',
  java: 'java',
  javascript: 'javascript',
  kotlin: 'kotlin',
  php: 'php',
  python: 'python',
  ruby: 'ruby',
  rust: 'rust',
  swift: 'swift',
  typescript: 'typescript',
};

const CodingQuestion: FC<CodingQuestionProps> = ({
  content,
  starterCode,
  allowedLanguages,
  answerContent,
  selectedLanguage,
  codeOutput,
  onCodeChange,
  onLanguageChange,
  onOutputChange,
}) => {
  const [running, setRunning] = useState(false);
  const languages = allowedLanguages ?? ['python', 'javascript'];

  const handleRun = async (): Promise<void> => {
    setRunning(true);
    try {
      const res = await fetch('/api/execute-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLanguage,
          code: answerContent,
        }),
      });

      const data = await res.json();

      if (data.error) {
        onOutputChange(`Error: ${data.error}`);
      } else {
        const output = data.run?.output ?? '';
        const compileErr = data.compile?.stderr ?? '';
        onOutputChange(compileErr ? `Compile Error:\n${compileErr}` : output);
      }
    } catch {
      onOutputChange('Failed to execute code');
    }
    setRunning(false);
  };

  const monacoLanguage =
    LANGUAGE_TO_MONACO[selectedLanguage] ?? selectedLanguage;

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <MarkdownRenderer content={content} />
      </div>

      <Split hasGutter style={{ marginBottom: '0.5rem' }}>
        <SplitItem>
          <FormSelect
            value={selectedLanguage}
            onChange={(_e, val) => onLanguageChange(val)}
            aria-label="Language"
            style={{ width: '200px' }}
          >
            {languages.map((lang) => (
              <FormSelectOption key={lang} value={lang} label={lang} />
            ))}
          </FormSelect>
        </SplitItem>
        <SplitItem>
          <Button
            variant="secondary"
            onClick={handleRun}
            isLoading={running}
            isDisabled={running}
            icon={<PlayIcon />}
          >
            Run
          </Button>
        </SplitItem>
      </Split>

      <div
        style={{
          border: '1px solid var(--pf-t--global--border--color--default)',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '1rem',
        }}
      >
        <Editor
          height="400px"
          language={monacoLanguage}
          value={answerContent || starterCode || ''}
          onChange={(val) => onCodeChange(val ?? '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
          }}
        />
      </div>

      {codeOutput && (
        <FormGroup label="Output">
          <pre
            style={{
              background: 'var(--pf-t--global--background--color--secondary--default)',
              padding: '1rem',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '200px',
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap',
            }}
          >
            {codeOutput}
          </pre>
        </FormGroup>
      )}
    </div>
  );
};

export default CodingQuestion;
