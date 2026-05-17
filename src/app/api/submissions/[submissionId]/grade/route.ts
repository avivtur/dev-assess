import { eq, sum } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/index';
import { answers, submissions } from '@/db/schema';
import { auth } from '@/lib/auth';
import { canGradeSubmissions } from '@/lib/roles';

import type { UserRole } from '@/lib/roles';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (
    !session?.user ||
    !canGradeSubmissions(session.user.role as UserRole)
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { submissionId } = await params;
  const body = await request.json();
  const { answerId, awardedPoints } = body;

  if (!answerId || awardedPoints === undefined) {
    return NextResponse.json(
      { error: 'Missing fields' },
      { status: 400 },
    );
  }

  await db
    .update(answers)
    .set({ awardedPoints })
    .where(eq(answers.id, answerId));

  const allAnswers = await db
    .select()
    .from(answers)
    .where(eq(answers.submissionId, submissionId));

  const manualScore = allAnswers.reduce(
    (sum, a) => sum + (a.awardedPoints ?? 0),
    0,
  );

  await db
    .update(submissions)
    .set({ manualScore })
    .where(eq(submissions.id, submissionId));

  return NextResponse.json({ ok: true, manualScore });
}
