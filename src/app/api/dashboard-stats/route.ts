import { count } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/index';
import { invitations, submissions, tests } from '@/db/schema';
import { auth } from '@/lib/auth';

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [[testsRow], [invitationsRow], [submissionsRow]] = await Promise.all([
    db.select({ value: count() }).from(tests),
    db.select({ value: count() }).from(invitations),
    db.select({ value: count() }).from(submissions),
  ]);

  return NextResponse.json({
    totalTests: testsRow.value,
    totalInvitations: invitationsRow.value,
    totalSubmissions: submissionsRow.value,
  });
}
