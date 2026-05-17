import { NextResponse } from 'next/server';

import { executeCode } from '@/lib/piston';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const { language, code } = body;

  if (!language || !code) {
    return NextResponse.json(
      { error: 'Language and code are required' },
      { status: 400 },
    );
  }

  try {
    const result = await executeCode(language, code);
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Code execution failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
