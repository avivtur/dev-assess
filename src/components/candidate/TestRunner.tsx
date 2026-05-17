'use client';

import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageSection,
  Split,
  SplitItem,
  Title,
} from '@patternfly/react-core';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@patternfly/react-icons';
import { type FC, useCallback, useEffect, useRef, useState } from 'react';

import type { TestInfo, TestQuestion } from '@/app/test/[token]/page';

import CodingQuestion from './CodingQuestion';
import IntegrityMonitor from './IntegrityMonitor';
import TheoryQuestion from './TheoryQuestion';
import Timer from './Timer';

type AnswerState = {
  id: string;
  questionId: string;
  answerContent: string;
  selectedOptions: number[];
  selectedLanguage: string;
  codeOutput: string;
};

type TestRunnerProps = {
  test: TestInfo;
  submission: {
    id: string;
    startedAt: string;
    submittedAt: string | null;
  };
  initialAnswers: {
    id: string;
    questionId: string;
    answerContent: string | null;
    selectedOptions: number[] | null;
    selectedLanguage: string | null;
    codeOutput: string | null;
  }[];
  onSubmitted: () => void;
};

const AUTO_SAVE_INTERVAL_MS = 30_000;

const TestRunner: FC<TestRunnerProps> = ({
  test,
  submission,
  initialAnswers,
  onSubmitted,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [answersMap, setAnswersMap] = useState<Record<string, AnswerState>>(
    () => {
      const map: Record<string, AnswerState> = {};
      for (const a of initialAnswers) {
        const q = test.questions.find((q) => q.id === a.questionId);
        map[a.questionId] = {
          id: a.id,
          questionId: a.questionId,
          answerContent: a.answerContent ?? q?.starterCode ?? '',
          selectedOptions: a.selectedOptions ?? [],
          selectedLanguage:
            a.selectedLanguage ?? q?.allowedLanguages?.[0] ?? 'python',
          codeOutput: a.codeOutput ?? '',
        };
      }
      return map;
    },
  );

  const answersRef = useRef(answersMap);
  answersRef.current = answersMap;

  const currentQuestion = test.questions[currentIdx];
  const currentAnswer = answersMap[currentQuestion.id];

  const saveAnswer = useCallback(
    async (answer: AnswerState): Promise<void> => {
      await fetch(`/api/answers/${answer.id}/auto-save`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answerContent: answer.answerContent,
          selectedOptions: answer.selectedOptions,
          selectedLanguage: answer.selectedLanguage,
          codeOutput: answer.codeOutput,
        }),
      }).catch(() => {});
    },
    [],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const current = answersRef.current;
      Object.values(current).forEach((a) => saveAnswer(a));
    }, AUTO_SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [saveAnswer]);

  const updateAnswer = (
    questionId: string,
    updates: Partial<AnswerState>,
  ): void => {
    setAnswersMap((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], ...updates },
    }));
  };

  const navigateTo = (idx: number): void => {
    if (currentAnswer) {
      saveAnswer(currentAnswer);
    }
    setCurrentIdx(idx);
  };

  const handleSubmit = async (autoSubmitted = false): Promise<void> => {
    setSubmitting(true);

    const allAnswers = Object.values(answersRef.current);
    await Promise.all(allAnswers.map(saveAnswer));

    await fetch(`/api/submissions/${submission.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'submit', autoSubmitted }),
    });

    onSubmitted();
  };

  const handleTimerExpire = useCallback((): void => {
    handleSubmit(true);
  }, []);

  return (
    <IntegrityMonitor
      submissionId={submission.id}
      currentQuestionId={currentQuestion.id}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid var(--pf-t--global--border--color--default)',
          background: 'var(--pf-t--global--background--color--secondary--default)',
        }}
      >
        <Title headingLevel="h3">{test.title}</Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>
            Question {currentIdx + 1} of {test.questions.length}
          </span>
          <Timer
            startedAt={submission.startedAt}
            timeLimitMinutes={test.timeLimitMinutes}
            onExpire={handleTimerExpire}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 1.5rem', flexWrap: 'wrap' }}>
        {test.questions.map((q, idx) => (
          <Button
            key={q.id}
            variant={idx === currentIdx ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => navigateTo(idx)}
            style={{ minWidth: '2.5rem' }}
          >
            {idx + 1}
          </Button>
        ))}
      </div>

      <PageSection style={{ maxWidth: '900px' }}>
        <div style={{ marginBottom: '0.5rem', color: 'var(--pf-t--global--color--subtle)' }}>
          {currentQuestion.type.replace('_', ' ')} &middot;{' '}
          {currentQuestion.points} pts
        </div>

        {currentQuestion.type === 'coding' ? (
          <CodingQuestion
            content={currentQuestion.content}
            starterCode={currentQuestion.starterCode}
            allowedLanguages={currentQuestion.allowedLanguages}
            answerContent={currentAnswer?.answerContent ?? ''}
            selectedLanguage={currentAnswer?.selectedLanguage ?? 'python'}
            codeOutput={currentAnswer?.codeOutput ?? ''}
            onCodeChange={(code) =>
              updateAnswer(currentQuestion.id, { answerContent: code })
            }
            onLanguageChange={(lang) =>
              updateAnswer(currentQuestion.id, { selectedLanguage: lang })
            }
            onOutputChange={(output) =>
              updateAnswer(currentQuestion.id, { codeOutput: output })
            }
          />
        ) : (
          <TheoryQuestion
            type={currentQuestion.type}
            content={currentQuestion.content}
            options={currentQuestion.options}
            allowMultiple={currentQuestion.allowMultiple}
            answerContent={currentAnswer?.answerContent ?? ''}
            selectedOptions={currentAnswer?.selectedOptions ?? []}
            onAnswerChange={(content) =>
              updateAnswer(currentQuestion.id, {
                answerContent: content,
              })
            }
            onOptionsChange={(selected) =>
              updateAnswer(currentQuestion.id, {
                selectedOptions: selected,
              })
            }
          />
        )}

        <Split
          hasGutter
          style={{ marginTop: '2rem', justifyContent: 'space-between' }}
        >
          <SplitItem>
            <Button
              variant="secondary"
              isDisabled={currentIdx === 0}
              onClick={() => navigateTo(currentIdx - 1)}
              icon={<ArrowLeftIcon />}
            >
              Previous
            </Button>
          </SplitItem>
          <SplitItem>
            {currentIdx < test.questions.length - 1 ? (
              <Button
                onClick={() => navigateTo(currentIdx + 1)}
                icon={<ArrowRightIcon />}
                iconPosition="end"
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => setConfirmSubmit(true)}
              >
                Submit Test
              </Button>
            )}
          </SplitItem>
        </Split>
      </PageSection>

      <Modal
        isOpen={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        aria-label="Confirm submission"
        variant="small"
      >
        <ModalHeader title="Submit Test?" />
        <ModalBody>
          Are you sure you want to submit? You cannot change your answers
          after submission.
        </ModalBody>
        <ModalFooter>
          <Button
            onClick={() => handleSubmit(false)}
            isLoading={submitting}
            isDisabled={submitting}
          >
            Submit
          </Button>
          <Button
            variant="link"
            onClick={() => setConfirmSubmit(false)}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </IntegrityMonitor>
  );
};

export default TestRunner;
