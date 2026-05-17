import { desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/index';
import { tests } from '@/db/schema';
import { auth } from '@/lib/auth';
import { canCreateTests } from '@/lib/roles';

import type { UserRole } from '@/lib/roles';

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allTests = await db
    .select()
    .from(tests)
    .orderBy(desc(tests.createdAt));

  return NextResponse.json(allTests);
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user || !canCreateTests(session.user.role as UserRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, timeLimitMinutes } = body;

  if (!title) {
    return NextResponse.json(
      { error: 'Title is required' },
      { status: 400 },
    );
  }

  const [newTest] = await db
    .insert(tests)
    .values({
      title,
      description: description ?? '',
      timeLimitMinutes: timeLimitMinutes ?? 60,
      createdBy: session.user.id,
    })
    .returning();

  return NextResponse.json(newTest, { status: 201 });
}
