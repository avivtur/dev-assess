'use client';

import {
  Button,
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  NumberInput,
  PageSection,
  Title,
} from '@patternfly/react-core';
import Editor from '@monaco-editor/react';
import { useParams } from 'next/navigation';
import { type FC, useCallback, useEffect, useState } from 'react';

import MarkdownRenderer from '@/components/common/MarkdownRenderer';

import type { McOption } from '@/db/schema';

type Question = {
  id: string;
  type: 'multiple_choice' | 'free_text' | 'coding';
  content: string;
  options: McOption[] | null;
  allowMultiple: boolean;
  points: number;
  starterCode: string | null;
  allowedLanguages: string[] | null;
};

type Answer = {
  id: string;
  questionId: string;
  answerContent: string | null;
  selectedOptions: number[] | null;
  selectedLanguage: string | null;
  codeOutput: string | null;
  isCorrect: boolean | null;
  awardedPoints: number | null;
};

type IntegrityEvent = {
  id: string;
  questionId: string;
  eventType: 'paste' | 'focus_loss';
  occurredAt: string;
  detail: string | null;
};

type SubmissionData = {
  submission: {
    id: string;
    startedAt: string;
    submittedAt: string | null;
    autoSubmitted: boolean;
    autoScore: number;
    manualScore: number;
  };
  invitation: {
    candidateName: string;
    candidateEmail: string;
  };
  test: {
    title: string;
    timeLimitMinutes: number;
  };
  questions: Question[];
  answers: Answer[];
  integrityEvents: IntegrityEvent[];
};

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

const SubmissionDetailPage: FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const [data, setData] = useState<SubmissionData | null>(null);
  const [grades, setGrades] = useState<Record<string, number>>({});

  const loadData = useCallback((): void => {
    fetch(`/api/submissions/${submissionId}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        const initial: Record<string, number> = {};
        for (const a of d.answers) {
          if (a.awardedPoints !== null) {
            initial[a.id] = a.awardedPoints;
          }
        }
        setGrades(initial);
      })
      .catch(() => {});
  }, [submissionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGrade = async (
    answerId: string,
    points: number,
  ): Promise<void> => {
    setGrades((prev) => ({ ...prev, [answerId]: points }));
    await fetch(`/api/submissions/${submissionId}/grade`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answerId, awardedPoints: points }),
    });
    loadData();
  };

  if (!data) return <PageSection>Loading...</PageSection>;

  const { submission, invitation, test, questions, answers, integrityEvents } =
    data;

  const duration =
    submission.submittedAt && submission.startedAt
      ? Math.floor(
          (new Date(submission.submittedAt).getTime() -
            new Date(submission.startedAt).getTime()) /
            MS_PER_SECOND /
            SECONDS_PER_MINUTE,
        )
      : null;

  const pasteEvents = integrityEvents.filter(
    (e) => e.eventType === 'paste',
  );
  const focusEvents = integrityEvents.filter(
    (e) => e.eventType === 'focus_loss',
  );

  return (
    <PageSection>
      <Title headingLevel="h1" style={{ marginBottom: '1rem' }}>
        Submission Review
      </Title>

      <Card style={{ marginBottom: '1.5rem' }}>
        <CardBody>
          <DescriptionList isHorizontal>
            <DescriptionListGroup>
              <DescriptionListTerm>Candidate</DescriptionListTerm>
              <DescriptionListDescription>
                {invitation.candidateName} ({invitation.candidateEmail})
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Test</DescriptionListTerm>
              <DescriptionListDescription>
                {test.title}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Duration</DescriptionListTerm>
              <DescriptionListDescription>
                {duration !== null ? `${duration} min` : '-'} /{' '}
                {test.timeLimitMinutes} min
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Auto-submitted</DescriptionListTerm>
              <DescriptionListDescription>
                {submission.autoSubmitted ? 'Yes' : 'No'}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Scores</DescriptionListTerm>
              <DescriptionListDescription>
                Auto: {submission.autoScore} | Manual:{' '}
                {submission.manualScore} | Total:{' '}
                <strong>
                  {submission.autoScore + submission.manualScore}
                </strong>
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Integrity</DescriptionListTerm>
              <DescriptionListDescription>
                {pasteEvents.length > 0 && (
                  <Label
                    color="red"
                    style={{ marginRight: '0.25rem' }}
                  >
                    {pasteEvents.length} paste(s)
                  </Label>
                )}
                {focusEvents.length > 0 && (
                  <Label color="orange">
                    {focusEvents.length} tab switch(es)
                  </Label>
                )}
                {pasteEvents.length === 0 &&
                  focusEvents.length === 0 && (
                    <Label color="green">Clean</Label>
                  )}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </CardBody>
      </Card>

      {questions.map((q, idx) => {
        const answer = answers.find((a) => a.questionId === q.id);
        if (!answer) return null;

        const qEvents = integrityEvents.filter(
          (e) => e.questionId === q.id,
        );

        return (
          <Card key={q.id} style={{ marginBottom: '1rem' }}>
            <CardTitle>
              Q{idx + 1}: {q.type.replace('_', ' ')} ({q.points} pts)
              {answer.isCorrect === true && (
                <Label
                  color="green"
                  style={{ marginLeft: '0.5rem' }}
                >
                  Correct
                </Label>
              )}
              {answer.isCorrect === false && (
                <Label color="red" style={{ marginLeft: '0.5rem' }}>
                  Incorrect
                </Label>
              )}
            </CardTitle>
            <CardBody>
              <div style={{ marginBottom: '1rem' }}>
                <MarkdownRenderer content={q.content} />
              </div>

              {q.type === 'multiple_choice' && q.options && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Options:</strong>
                  <ul>
                    {q.options.map((opt, oi) => {
                      const selected =
                        answer.selectedOptions?.includes(oi) ?? false;
                      return (
                        <li
                          key={oi}
                          style={{
                            fontWeight: selected ? 'bold' : 'normal',
                            color: opt.isCorrect
                              ? 'green'
                              : selected
                                ? 'red'
                                : undefined,
                          }}
                        >
                          {opt.text}
                          {selected && ' [selected]'}
                          {opt.isCorrect && ' (correct)'}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {q.type === 'free_text' && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Answer:</strong>
                  <div
                    style={{
                      background:
                        'var(--pf-t--global--background--color--secondary--default)',
                      padding: '1rem',
                      borderRadius: '4px',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {answer.answerContent ?? '(no answer)'}
                  </div>
                </div>
              )}

              {q.type === 'coding' && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>
                    Code ({answer.selectedLanguage ?? 'unknown'}):
                  </strong>
                  <div
                    style={{
                      border:
                        '1px solid var(--pf-t--global--border--color--default)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginTop: '0.5rem',
                    }}
                  >
                    <Editor
                      height="300px"
                      language={answer.selectedLanguage ?? 'plaintext'}
                      value={answer.answerContent ?? ''}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                      }}
                    />
                  </div>
                  {answer.codeOutput && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <strong>Output:</strong>
                      <pre
                        style={{
                          background:
                            'var(--pf-t--global--background--color--secondary--default)',
                          padding: '0.75rem',
                          borderRadius: '4px',
                          overflow: 'auto',
                          maxHeight: '150px',
                          fontSize: '0.875rem',
                        }}
                      >
                        {answer.codeOutput}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {q.type !== 'multiple_choice' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <strong>Score:</strong>
                  <NumberInput
                    value={grades[answer.id] ?? 0}
                    min={0}
                    max={q.points}
                    onMinus={() =>
                      handleGrade(
                        answer.id,
                        Math.max(0, (grades[answer.id] ?? 0) - 1),
                      )
                    }
                    onPlus={() =>
                      handleGrade(
                        answer.id,
                        Math.min(
                          q.points,
                          (grades[answer.id] ?? 0) + 1,
                        ),
                      )
                    }
                    onChange={(e) =>
                      handleGrade(
                        answer.id,
                        Number((e.target as HTMLInputElement).value),
                      )
                    }
                  />
                  <span>/ {q.points}</span>
                </div>
              )}

              {qEvents.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>Integrity Events:</strong>
                  <ul style={{ fontSize: '0.875rem' }}>
                    {qEvents.map((ev) => (
                      <li key={ev.id}>
                        <Label
                          color={
                            ev.eventType === 'paste' ? 'red' : 'orange'
                          }
                          isCompact
                        >
                          {ev.eventType}
                        </Label>{' '}
                        {new Date(ev.occurredAt).toLocaleTimeString()}
                        {ev.detail && (
                          <span style={{ color: 'var(--pf-t--global--color--subtle)' }}>
                            {' '}
                            &mdash; {ev.detail.slice(0, 100)}
                            {ev.detail.length > 100 && '...'}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardBody>
          </Card>
        );
      })}
    </PageSection>
  );
};

export default SubmissionDetailPage;
