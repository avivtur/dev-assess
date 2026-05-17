import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/index';
import { answers, integrityEvents, invitations, submissions } from '@/db/schema';
import { auth } from '@/lib/auth';
import { hasMinRole } from '@/lib/roles';

import type { UserRole } from '@/lib/roles';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ invitationId: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasMinRole(session.user.role as UserRole, 'manager')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { invitationId } = await params;

  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.id, invitationId))
    .limit(1);

  if (!invitation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const [submission] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.invitationId, invitationId))
    .limit(1);

  if (submission) {
    await db
      .delete(integrityEvents)
      .where(eq(integrityEvents.submissionId, submission.id));
    await db.delete(answers).where(eq(answers.submissionId, submission.id));
    await db.delete(submissions).where(eq(submissions.id, submission.id));
  }

  await db.delete(invitations).where(eq(invitations.id, invitationId));

  return NextResponse.json({ ok: true });
}
