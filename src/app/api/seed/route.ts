import { NextResponse } from 'next/server';

import { seedAdmin } from '@/db/seed';

export async function POST(): Promise<NextResponse> {
  try {
    await seedAdmin();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to seed admin' },
      { status: 500 },
    );
  }
}
