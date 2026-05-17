import { test, expect, ADMIN_CREDS } from './fixtures';

test.describe('User Management', () => {
  const TIMESTAMP = Date.now();
  const NEW_MANAGER = {
    name: `E2E Manager ${TIMESTAMP}`,
    email: `e2e-manager-${TIMESTAMP}@test.com`,
    password: 'testpass123',
  };
  const NEW_RECRUITER = {
    name: `E2E Recruiter ${TIMESTAMP}`,
    email: `e2e-recruiter-${TIMESTAMP}@test.com`,
    password: 'testpass123',
  };

  test('admin creates a manager', async ({ adminPage }) => {
    await adminPage.goto('/users');
    await adminPage.getByRole('button', { name: 'Create User' }).click();

    await adminPage.getByLabel('Name', { exact: true }).fill(NEW_MANAGER.name);
    await adminPage.getByLabel('Email', { exact: true }).fill(NEW_MANAGER.email);
    await adminPage.getByLabel('Password').fill(NEW_MANAGER.password);
    await adminPage.locator('#user-role').selectOption('manager');

    await adminPage.getByRole('button', { name: 'Create' }).click();

    await expect(adminPage.getByText(NEW_MANAGER.name)).toBeVisible();
    await expect(adminPage.getByText(NEW_MANAGER.email)).toBeVisible();
  });

  test('admin creates a recruiter', async ({ adminPage }) => {
    await adminPage.goto('/users');
    await adminPage.getByRole('button', { name: 'Create User' }).click();

    await adminPage.getByLabel('Name', { exact: true }).fill(NEW_RECRUITER.name);
    await adminPage.getByLabel('Email', { exact: true }).fill(NEW_RECRUITER.email);
    await adminPage.getByLabel('Password').fill(NEW_RECRUITER.password);
    await adminPage.locator('#user-role').selectOption('recruiter');

    await adminPage.getByRole('button', { name: 'Create' }).click();

    await expect(adminPage.getByText(NEW_RECRUITER.name)).toBeVisible();
    await expect(adminPage.getByText(NEW_RECRUITER.email)).toBeVisible();
  });

  test('newly created manager can log in', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(NEW_MANAGER.email);
    await page.getByLabel('Password').fill(NEW_MANAGER.password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Welcome')).toBeVisible();
  });
});
