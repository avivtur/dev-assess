import { request } from '@playwright/test';

import { ADMIN_CREDS, MANAGER_CREDS, RECRUITER_CREDS } from './fixtures';

const BASE_URL = 'http://localhost:3001';

async function globalSetup(): Promise<void> {
  const ctx = await request.newContext({ baseURL: BASE_URL });

  await ctx.post('/api/seed');

  const csrfRes = await ctx.get('/api/auth/csrf');
  const { csrfToken } = await csrfRes.json();

  await ctx.post('/api/auth/callback/credentials', {
    form: {
      email: ADMIN_CREDS.email,
      password: ADMIN_CREDS.password,
      csrfToken,
      json: 'true',
    },
  });

  try {
    await ctx.post('/api/users', {
      data: {
        email: MANAGER_CREDS.email,
        password: MANAGER_CREDS.password,
        name: MANAGER_CREDS.name,
        role: 'manager',
      },
    });
  } catch {
    // user may already exist from a previous run
  }

  try {
    await ctx.post('/api/users', {
      data: {
        email: RECRUITER_CREDS.email,
        password: RECRUITER_CREDS.password,
        name: RECRUITER_CREDS.name,
        role: 'recruiter',
      },
    });
  } catch {
    // user may already exist from a previous run
  }

  await ctx.dispose();
}

export default globalSetup;
