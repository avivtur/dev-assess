import { test as base, type Page, type BrowserContext } from '@playwright/test';

export const ADMIN_CREDS = {
  email: 'admin@devassess.com',
  password: 'admin123',
  name: 'Admin',
};

export const MANAGER_CREDS = {
  email: 'manager-test@devassess.com',
  password: 'manager123',
  name: 'Test Manager',
};

export const RECRUITER_CREDS = {
  email: 'recruiter-test@devassess.com',
  password: 'recruiter123',
  name: 'Test Recruiter',
};

async function loginViaUI(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(/\/(dashboard|tests|users)/);
}

async function dismissNextJsOverlay(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const hideOverlay = (): void => {
      const style = document.createElement('style');
      style.textContent =
        'nextjs-portal { display: none !important; pointer-events: none !important; }';
      (document.head ?? document.documentElement).appendChild(style);
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', hideOverlay);
    } else {
      hideOverlay();
    }
  });
}

type AuthFixtures = {
  adminPage: Page;
  managerPage: Page;
  recruiterPage: Page;
};

export const test = base.extend<AuthFixtures>({
  page: async ({ page }, use) => {
    await dismissNextJsOverlay(page);
    await use(page);
  },
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await dismissNextJsOverlay(page);
    await loginViaUI(page, ADMIN_CREDS.email, ADMIN_CREDS.password);
    await use(page);
    await context.close();
  },
  managerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await dismissNextJsOverlay(page);
    await loginViaUI(page, MANAGER_CREDS.email, MANAGER_CREDS.password);
    await use(page);
    await context.close();
  },
  recruiterPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await dismissNextJsOverlay(page);
    await loginViaUI(page, RECRUITER_CREDS.email, RECRUITER_CREDS.password);
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
