import { NextResponse } from 'next/server';

import { db } from '@/db/index';
import { questions } from '@/db/schema';
import { auth } from '@/lib/auth';
import { canCreateTests } from '@/lib/roles';

import type { UserRole } from '@/lib/roles';

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user || !canCreateTests(session.user.role as UserRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const {
    testId,
    type,
    content,
    options,
    allowMultiple,
    points,
    starterCode,
    allowedLanguages,
    orderIndex,
  } = body;

  if (!testId || !type || !content) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    );
  }

  const [newQuestion] = await db
    .insert(questions)
    .values({
      testId,
      type,
      content,
      options: options ?? null,
      allowMultiple: allowMultiple ?? false,
      points: points ?? 1,
      starterCode: starterCode ?? null,
      allowedLanguages: allowedLanguages ?? null,
      orderIndex: orderIndex ?? 0,
    })
    .returning();

  return NextResponse.json(newQuestion, { status: 201 });
}
