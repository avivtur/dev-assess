import { test, expect } from './fixtures';

test.describe('Test CRUD', () => {
  const TEST_TITLE = `E2E CRUD Test ${Date.now()}`;
  const EDITED_TITLE = `${TEST_TITLE} (Edited)`;
  let testId: string;

  test('create a test', async ({ adminPage }) => {
    await adminPage.goto('/tests/new');

    await adminPage.getByLabel('Title').fill(TEST_TITLE);
    await adminPage.getByLabel('Description').fill('Created by E2E test');

    await adminPage.getByRole('button', { name: 'Create Test' }).click();

    await adminPage.waitForURL(/\/tests\/[a-f0-9-]+$/);
    await expect(adminPage.getByText(TEST_TITLE)).toBeVisible();

    testId = adminPage.url().split('/tests/')[1];
  });

  test('edit test metadata', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}`);

    await adminPage.getByRole('button', { name: 'Edit test' }).click();

    const titleInput = adminPage.locator('#edit-title');
    await titleInput.clear();
    await titleInput.fill(EDITED_TITLE);

    await adminPage.getByRole('button', { name: 'Save' }).click();

    await expect(adminPage.getByText(EDITED_TITLE)).toBeVisible();
  });

  test('duplicate a test', async ({ adminPage }) => {
    await adminPage.goto('/tests');

    const row = adminPage.getByRole('row').filter({ hasText: EDITED_TITLE });
    await row.getByRole('button', { name: 'Duplicate' }).click();

    await adminPage.waitForURL(/\/tests\/[a-f0-9-]+$/);
    await expect(adminPage.getByText(`${EDITED_TITLE} (Copy)`)).toBeVisible();
  });

  test('delete a test', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}`);

    await adminPage.getByRole('button', { name: 'Delete Test' }).click();
    await adminPage.getByRole('button', { name: 'Delete' }).click();

    await adminPage.waitForURL('/tests');
    await expect(adminPage.getByText(EDITED_TITLE)).not.toBeVisible();
  });

  test('recruiter cannot create tests', async ({ recruiterPage }) => {
    await recruiterPage.goto('/tests');
    await expect(
      recruiterPage.getByRole('link', { name: 'Create Test' }),
    ).not.toBeVisible();
  });
});
