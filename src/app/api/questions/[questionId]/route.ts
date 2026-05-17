import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/index';
import { questions } from '@/db/schema';
import { auth } from '@/lib/auth';
import { canCreateTests } from '@/lib/roles';

import type { UserRole } from '@/lib/roles';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user || !canCreateTests(session.user.role as UserRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { questionId } = await params;
  const body = await request.json();

  const [updated] = await db
    .update(questions)
    .set({
      type: body.type,
      content: body.content,
      options: body.options,
      allowMultiple: body.allowMultiple,
      points: body.points,
      starterCode: body.starterCode,
      allowedLanguages: body.allowedLanguages,
      orderIndex: body.orderIndex,
    })
    .where(eq(questions.id, questionId))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ questionId: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user || !canCreateTests(session.user.role as UserRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { questionId } = await params;
  await db.delete(questions).where(eq(questions.id, questionId));

  return NextResponse.json({ ok: true });
}
