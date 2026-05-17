import dotenv from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

dotenv.config({ path: '.env.test', override: true });

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: `DATABASE_URL="${process.env.DATABASE_URL}" NEXTAUTH_SECRET="${process.env.NEXTAUTH_SECRET}" NEXTAUTH_URL="http://localhost:3001" ADMIN_EMAIL="${process.env.ADMIN_EMAIL}" ADMIN_PASSWORD="${process.env.ADMIN_PASSWORD}" npx next dev --port 3001`,
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: 'pipe',
  },
  globalSetup: './e2e/global-setup.ts',
});
