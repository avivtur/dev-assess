import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

import { db } from './index';
import { users } from './schema';

const SALT_ROUNDS = 12;

export async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) return;

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.role, 'admin'))
    .limit(1);

  if (existing.length > 0) return;

  const hash = await bcrypt.hash(password, SALT_ROUNDS);

  await db.insert(users).values({
    email,
    passwordHash: hash,
    name: 'Admin',
    role: 'admin',
  });
}
