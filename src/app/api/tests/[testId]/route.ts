import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/index';
import { questions, tests } from '@/db/schema';
import { auth } from '@/lib/auth';
import { canCreateTests } from '@/lib/roles';

import type { UserRole } from '@/lib/roles';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ testId: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { testId } = await params;

  const [test] = await db
    .select()
    .from(tests)
    .where(eq(tests.id, testId))
    .limit(1);

  if (!test) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const testQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.testId, testId))
    .orderBy(questions.orderIndex);

  return NextResponse.json({ ...test, questions: testQuestions });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ testId: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user || !canCreateTests(session.user.role as UserRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { testId } = await params;
  const body = await request.json();

  const [updated] = await db
    .update(tests)
    .set({
      title: body.title,
      description: body.description,
      timeLimitMinutes: body.timeLimitMinutes,
      isActive: body.isActive,
    })
    .where(eq(tests.id, testId))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ testId: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { testId } = await params;
  await db.delete(tests).where(eq(tests.id, testId));

  return NextResponse.json({ ok: true });
}
