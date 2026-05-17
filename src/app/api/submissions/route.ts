import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/index';
import {
  answers,
  invitations,
  questions,
  submissions,
} from '@/db/schema';
import { gradeMultipleChoice } from '@/utils/scoring';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const { token } = body;

  if (!token) {
    return NextResponse.json(
      { error: 'Token is required' },
      { status: 400 },
    );
  }

  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.token, token))
    .limit(1);

  if (!invitation) {
    return NextResponse.json(
      { error: 'Invalid invitation' },
      { status: 404 },
    );
  }

  if (invitation.status === 'submitted') {
    return NextResponse.json(
      { error: 'Test already submitted' },
      { status: 400 },
    );
  }

  if (invitation.expiresAt < new Date()) {
    return NextResponse.json(
      { error: 'Invitation expired' },
      { status: 400 },
    );
  }

  const existing = await db
    .select()
    .from(submissions)
    .where(eq(submissions.invitationId, invitation.id))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(existing[0]);
  }

  await db
    .update(invitations)
    .set({ status: 'in_progress' })
    .where(eq(invitations.id, invitation.id));

  const [submission] = await db
    .insert(submissions)
    .values({ invitationId: invitation.id })
    .returning();

  const testQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.testId, invitation.testId))
    .orderBy(questions.orderIndex);

  if (testQuestions.length > 0) {
    await db.insert(answers).values(
      testQuestions.map((q) => ({
        submissionId: submission.id,
        questionId: q.id,
      })),
    );
  }

  return NextResponse.json(submission, { status: 201 });
}
