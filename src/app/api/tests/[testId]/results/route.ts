import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/index';
import { integrityEvents, invitations, submissions } from '@/db/schema';
import { auth } from '@/lib/auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ testId: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { testId } = await params;

  const testInvitations = await db
    .select()
    .from(invitations)
    .where(eq(invitations.testId, testId));

  const results = [];

  for (const inv of testInvitations) {
    const [sub] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.invitationId, inv.id))
      .limit(1);

    if (!sub) continue;

    const events = await db
      .select()
      .from(integrityEvents)
      .where(eq(integrityEvents.submissionId, sub.id));

    const pasteCount = events.filter(
      (e) => e.eventType === 'paste',
    ).length;
    const focusLossCount = events.filter(
      (e) => e.eventType === 'focus_loss',
    ).length;

    results.push({
      submissionId: sub.id,
      candidateName: inv.candidateName,
      candidateEmail: inv.candidateEmail,
      status: inv.status,
      autoScore: sub.autoScore,
      autoSubmitted: sub.autoSubmitted,
      manualScore: sub.manualScore,
      startedAt: sub.startedAt,
      submittedAt: sub.submittedAt,
      pasteCount,
      focusLossCount,
    });
  }

  return NextResponse.json(results);
}
