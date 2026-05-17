import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/index';
import { invitations } from '@/db/schema';
import { auth } from '@/lib/auth';
import { generateInvitationToken } from '@/utils/tokens';

const DEFAULT_EXPIRY_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function GET(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const testId = url.searchParams.get('testId');

  const query = testId
    ? db
        .select()
        .from(invitations)
        .where(eq(invitations.testId, testId))
        .orderBy(desc(invitations.createdAt))
    : db
        .select()
        .from(invitations)
        .orderBy(desc(invitations.createdAt));

  const result = await query;
  return NextResponse.json(result);
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { testId, candidateName, candidateEmail, expiryDays } = body;

  if (!testId || !candidateName || !candidateEmail) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    );
  }

  const days = expiryDays ?? DEFAULT_EXPIRY_DAYS;
  const expiresAt = new Date(Date.now() + days * MS_PER_DAY);
  const token = generateInvitationToken();

  const [invitation] = await db
    .insert(invitations)
    .values({
      testId,
      createdBy: session.user.id,
      candidateName,
      candidateEmail,
      token,
      expiresAt,
    })
    .returning();

  return NextResponse.json(invitation, { status: 201 });
}
