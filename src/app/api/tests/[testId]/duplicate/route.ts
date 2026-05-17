import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/index';
import { questions, tests } from '@/db/schema';
import { auth } from '@/lib/auth';
import { canCreateTests } from '@/lib/roles';

import type { UserRole } from '@/lib/roles';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ testId: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user || !canCreateTests(session.user.role as UserRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { testId } = await params;

  const [original] = await db
    .select()
    .from(tests)
    .where(eq(tests.id, testId))
    .limit(1);

  if (!original) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const [newTest] = await db
    .insert(tests)
    .values({
      title: `${original.title} (Copy)`,
      description: original.description,
      timeLimitMinutes: original.timeLimitMinutes,
      createdBy: session.user.id,
    })
    .returning();

  const originalQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.testId, testId));

  if (originalQuestions.length > 0) {
    await db.insert(questions).values(
      originalQuestions.map((q) => ({
        testId: newTest.id,
        type: q.type,
        content: q.content,
        options: q.options,
        allowMultiple: q.allowMultiple,
        points: q.points,
        starterCode: q.starterCode,
        allowedLanguages: q.allowedLanguages,
        orderIndex: q.orderIndex,
      })),
    );
  }

  return NextResponse.json(newTest, { status: 201 });
}
