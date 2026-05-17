import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema';

type Database = ReturnType<typeof drizzle<typeof schema>>;

function createDb(): Database {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema });
}

let _db: Database | null = null;

function getDb(): Database {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

export const db = new Proxy({} as Database, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
