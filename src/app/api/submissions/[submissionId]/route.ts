import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/index';
import {
  answers,
  integrityEvents,
  invitations,
  questions,
  submissions,
  tests,
} from '@/db/schema';
import { gradeMultipleChoice } from '@/utils/scoring';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ submissionId: string }> },
): Promise<NextResponse> {
  const { submissionId } = await params;

  const [submission] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.id, submissionId))
    .limit(1);

  if (!submission) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const submissionAnswers = await db
    .select()
    .from(answers)
    .where(eq(answers.submissionId, submissionId));

  const events = await db
    .select()
    .from(integrityEvents)
    .where(eq(integrityEvents.submissionId, submissionId));

  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.id, submission.invitationId))
    .limit(1);

  let test = null;
  let testQuestions: (typeof questions.$inferSelect)[] = [];

  if (invitation) {
    const [t] = await db
      .select()
      .from(tests)
      .where(eq(tests.id, invitation.testId))
      .limit(1);
    test = t;

    testQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.testId, invitation.testId))
      .orderBy(questions.orderIndex);
  }

  return NextResponse.json({
    submission,
    answers: submissionAnswers,
    integrityEvents: events,
    invitation,
    test,
    questions: testQuestions,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> },
): Promise<NextResponse> {
  const { submissionId } = await params;
  const body = await request.json();

  if (body.action === 'submit') {
    const submissionAnswers = await db
      .select()
      .from(answers)
      .where(eq(answers.submissionId, submissionId));

    const [submission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1);

    if (!submission) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const [invitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.id, submission.invitationId))
      .limit(1);

    let autoScore = 0;

    for (const ans of submissionAnswers) {
      const [q] = await db
        .select()
        .from(questions)
        .where(eq(questions.id, ans.questionId))
        .limit(1);

      if (q?.type === 'multiple_choice') {
        const correct = gradeMultipleChoice(ans.selectedOptions, q.options);
        await db
          .update(answers)
          .set({ isCorrect: correct })
          .where(eq(answers.id, ans.id));

        if (correct) {
          autoScore += q.points;
        }
      }
    }

    await db
      .update(submissions)
      .set({
        submittedAt: new Date(),
        autoSubmitted: body.autoSubmitted ?? false,
        autoScore,
      })
      .where(eq(submissions.id, submissionId));

    if (invitation) {
      await db
        .update(invitations)
        .set({ status: 'submitted' })
        .where(eq(invitations.id, invitation.id));
    }

    return NextResponse.json({ ok: true, autoScore });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
