import { NextResponse } from 'next/server';

import { db } from '@/db/index';
import { integrityEvents } from '@/db/schema';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const { submissionId, questionId, eventType, detail } = body;

  if (!submissionId || !questionId || !eventType) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    );
  }

  await db.insert(integrityEvents).values({
    submissionId,
    questionId,
    eventType,
    detail: detail?.slice(0, 500) ?? null,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
