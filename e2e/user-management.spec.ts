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

    const modal = adminPage.locator('[aria-label="Create user"]');
    await expect(modal).toBeVisible();

    await modal.locator('#user-name').fill(NEW_MANAGER.name);
    await modal.locator('#user-email').fill(NEW_MANAGER.email);
    await modal.locator('#user-password').fill(NEW_MANAGER.password);
    await modal.locator('#user-role').selectOption('manager');

    await modal.getByRole('button', { name: 'Create' }).click();

    await expect(modal).not.toBeVisible();
    await expect(adminPage.getByText(NEW_MANAGER.name)).toBeVisible();
    await expect(adminPage.getByText(NEW_MANAGER.email)).toBeVisible();
  });

  test('admin creates a recruiter', async ({ adminPage }) => {
    await adminPage.goto('/users');
    await adminPage.getByRole('button', { name: 'Create User' }).click();

    const modal = adminPage.locator('[aria-label="Create user"]');
    await expect(modal).toBeVisible();

    await modal.locator('#user-name').fill(NEW_RECRUITER.name);
    await modal.locator('#user-email').fill(NEW_RECRUITER.email);
    await modal.locator('#user-password').fill(NEW_RECRUITER.password);
    await modal.locator('#user-role').selectOption('recruiter');

    await modal.getByRole('button', { name: 'Create' }).click();

    await expect(modal).not.toBeVisible();
    await expect(adminPage.getByText(NEW_RECRUITER.name)).toBeVisible();
    await expect(adminPage.getByText(NEW_RECRUITER.email)).toBeVisible();
  });

  test('newly created manager can log in', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill(NEW_MANAGER.email);
    await page.locator('#password').fill(NEW_MANAGER.password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Welcome')).toBeVisible();
  });
});
