'use client';

import { useParams } from 'next/navigation';
import { type FC, useCallback, useEffect, useState } from 'react';

import TestLanding from '@/components/candidate/TestLanding';
import TestRunner from '@/components/candidate/TestRunner';

import type { McOption } from '@/db/schema';

export type TestQuestion = {
  id: string;
  type: 'multiple_choice' | 'free_text' | 'coding';
  content: string;
  options: McOption[] | null;
  allowMultiple: boolean;
  points: number;
  starterCode: string | null;
  allowedLanguages: string[] | null;
  orderIndex: number;
};

export type TestInfo = {
  id: string;
  title: string;
  description: string;
  timeLimitMinutes: number;
  questions: TestQuestion[];
};

type Answer = {
  id: string;
  questionId: string;
  answerContent: string | null;
  selectedOptions: number[] | null;
  selectedLanguage: string | null;
  codeOutput: string | null;
};

type Submission = {
  id: string;
  startedAt: string;
  submittedAt: string | null;
};

type TestPageState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'landing'; test: TestInfo }
  | {
      phase: 'running';
      test: TestInfo;
      submission: Submission;
      answers: Answer[];
    }
  | { phase: 'submitted' };

const CandidateTestPage: FC = () => {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<TestPageState>({ phase: 'loading' });

  const loadTestInfo = useCallback(async (): Promise<void> => {
    const res = await fetch(`/api/test-public/${token}`);
    if (!res.ok) {
      const data = await res.json();
      setState({ phase: 'error', message: data.error ?? 'Not found' });
      return;
    }

    const data = await res.json();

    if (data.status === 'submitted') {
      setState({ phase: 'submitted' });
      return;
    }

    if (data.submission) {
      setState({
        phase: 'running',
        test: data.test,
        submission: data.submission,
        answers: data.answers,
      });
      return;
    }

    setState({ phase: 'landing', test: data.test });
  }, [token]);

  useEffect(() => {
    loadTestInfo();
  }, [loadTestInfo]);

  const handleStart = async (): Promise<void> => {
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (res.ok) {
      await loadTestInfo();
    }
  };

  const handleSubmit = (): void => {
    setState({ phase: 'submitted' });
  };

  switch (state.phase) {
    case 'loading':
      return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          Loading...
        </div>
      );

    case 'error':
      return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <h2>Unable to load test</h2>
          <p>{state.message}</p>
        </div>
      );

    case 'landing':
      return <TestLanding test={state.test} onStart={handleStart} />;

    case 'running':
      return (
        <TestRunner
          test={state.test}
          submission={state.submission}
          initialAnswers={state.answers}
          onSubmitted={handleSubmit}
        />
      );

    case 'submitted':
      return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <h1>Thank You!</h1>
          <p>
            Your test has been submitted successfully. The hiring team
            will review your answers.
          </p>
        </div>
      );
  }
};

export default CandidateTestPage;
