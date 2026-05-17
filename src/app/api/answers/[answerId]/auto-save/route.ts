import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/index';
import { answers } from '@/db/schema';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ answerId: string }> },
): Promise<NextResponse> {
  const { answerId } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {};

  if (body.answerContent !== undefined) {
    updateData.answerContent = body.answerContent;
  }
  if (body.selectedOptions !== undefined) {
    updateData.selectedOptions = body.selectedOptions;
  }
  if (body.codeOutput !== undefined) {
    updateData.codeOutput = body.codeOutput;
  }
  if (body.selectedLanguage !== undefined) {
    updateData.selectedLanguage = body.selectedLanguage;
  }

  if (Object.keys(updateData).length > 0) {
    await db
      .update(answers)
      .set(updateData)
      .where(eq(answers.id, answerId));
  }

  return NextResponse.json({ ok: true });
}
