import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/index';
import {
  answers,
  invitations,
  questions,
  submissions,
  tests,
} from '@/db/schema';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await params;

  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.token, token))
    .limit(1);

  if (!invitation) {
    return NextResponse.json(
      { error: 'Invalid test link' },
      { status: 404 },
    );
  }

  if (invitation.status === 'submitted') {
    return NextResponse.json({ status: 'submitted' });
  }

  if (invitation.expiresAt < new Date()) {
    return NextResponse.json(
      { error: 'This test link has expired' },
      { status: 400 },
    );
  }

  const [test] = await db
    .select()
    .from(tests)
    .where(eq(tests.id, invitation.testId))
    .limit(1);

  if (!test) {
    return NextResponse.json(
      { error: 'Test not found' },
      { status: 404 },
    );
  }

  const testQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.testId, test.id))
    .orderBy(questions.orderIndex);

  const candidateQuestions = testQuestions.map((q) => ({
    id: q.id,
    type: q.type,
    content: q.content,
    options: q.type === 'multiple_choice' && q.options
      ? q.options.map((o) => ({ text: o.text, isCorrect: false }))
      : null,
    allowMultiple: q.allowMultiple,
    points: q.points,
    starterCode: q.starterCode,
    allowedLanguages: q.allowedLanguages,
    orderIndex: q.orderIndex,
  }));

  const [existingSubmission] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.invitationId, invitation.id))
    .limit(1);

  if (existingSubmission) {
    const existingAnswers = await db
      .select()
      .from(answers)
      .where(eq(answers.submissionId, existingSubmission.id));

    return NextResponse.json({
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        timeLimitMinutes: test.timeLimitMinutes,
        questions: candidateQuestions,
      },
      submission: existingSubmission,
      answers: existingAnswers,
    });
  }

  return NextResponse.json({
    test: {
      id: test.id,
      title: test.title,
      description: test.description,
      timeLimitMinutes: test.timeLimitMinutes,
      questions: candidateQuestions,
    },
  });
}
