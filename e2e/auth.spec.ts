import { test, expect, ADMIN_CREDS, MANAGER_CREDS, RECRUITER_CREDS } from './fixtures';

test.describe('Authentication and Access Control', () => {
  test('unauthenticated users are redirected to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/tests');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/users');
    await expect(page).toHaveURL(/\/login/);
  });

  test('admin can log in and sees all nav items', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(ADMIN_CREDS.email);
    await page.getByLabel('Password').fill(ADMIN_CREDS.password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/dashboard/);

    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Tests' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();
  });

  test('manager can log in and does NOT see Users nav', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(MANAGER_CREDS.email);
    await page.getByLabel('Password').fill(MANAGER_CREDS.password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/dashboard/);

    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Tests' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Users' })).not.toBeVisible();
  });

  test('recruiter can log in and does NOT see Users nav', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(RECRUITER_CREDS.email);
    await page.getByLabel('Password').fill(RECRUITER_CREDS.password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/dashboard/);

    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Tests' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Users' })).not.toBeVisible();
  });

  test('admin can access /users', async ({ adminPage }) => {
    await adminPage.goto('/users');
    await expect(adminPage.getByText('User Management')).toBeVisible();
  });

  test('manager is redirected from /users', async ({ managerPage }) => {
    await managerPage.goto('/users');
    await expect(managerPage).toHaveURL(/\/dashboard/);
  });

  test('recruiter is redirected from /users', async ({ recruiterPage }) => {
    await recruiterPage.goto('/users');
    await expect(recruiterPage).toHaveURL(/\/dashboard/);
  });

  test('sign out returns to login page', async ({ adminPage }) => {
    await adminPage.goto('/dashboard');
    await adminPage.getByRole('button', { name: 'Sign out' }).click();
    await expect(adminPage).toHaveURL(/\/login/);
  });
});
