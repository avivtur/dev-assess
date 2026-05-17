import { test, expect } from './fixtures';
import { createTestViaApi, loginOnPage } from './helpers';

test.describe('Question Management', () => {
  let testId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginOnPage(page, 'admin@devassess.com', 'admin123');

    const t = await createTestViaApi(page, `E2E Questions Test ${Date.now()}`);
    testId = t.id;
    await page.close();
  });

  test('add MC question (single select)', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}`);
    await adminPage.getByRole('button', { name: 'Add Question' }).click();

    const modal = adminPage.locator('[aria-label="Add question"]');
    await expect(modal).toBeVisible();

    await modal.locator('#q-type').selectOption('multiple_choice');
    await modal.locator('#q-content').fill('What color is the sky?');

    const options = modal.locator('[placeholder^="Option"]');
    await options.nth(0).fill('Red');
    await options.nth(1).fill('Blue');
    await modal.getByText('Add Option').click();
    await options.nth(2).fill('Green');

    await modal.locator('#opt-correct-1').check();

    await modal.getByRole('button', { name: 'Add Question' }).click();

    await expect(modal).not.toBeVisible();
    await expect(adminPage.getByText('Q1: multiple choice')).toBeVisible();
    await expect(adminPage.getByText('Blue (correct)')).toBeVisible();
  });

  test('add MC question (multi select)', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}`);
    await adminPage.getByRole('button', { name: 'Add Question' }).first().click();

    const modal = adminPage.locator('[aria-label="Add question"]');
    await expect(modal).toBeVisible();

    await modal.locator('#q-type').selectOption('multiple_choice');
    await modal.locator('#q-content').fill('Which are programming languages?');
    await modal.locator('#q-allow-multi').check();

    const options = modal.locator('[placeholder^="Option"]');
    await options.nth(0).fill('Python');
    await options.nth(1).fill('HTML');

    await modal.locator('#opt-correct-0').check();

    await modal.getByRole('button', { name: 'Add Question' }).click();

    await expect(modal).not.toBeVisible();
    await expect(adminPage.getByText('Q2: multiple choice')).toBeVisible();
  });

  test('add free text question', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}`);
    await adminPage.getByRole('button', { name: 'Add Question' }).first().click();

    const modal = adminPage.locator('[aria-label="Add question"]');
    await expect(modal).toBeVisible();

    await modal.locator('#q-type').selectOption('free_text');
    await modal.locator('#q-content').fill(
      '## Explain\n\nDescribe the `async/await` pattern in JavaScript.',
    );

    await modal.getByRole('button', { name: 'Add Question' }).click();

    await expect(modal).not.toBeVisible();
    await expect(adminPage.getByText('Q3: free text')).toBeVisible();
  });

  test('add coding question', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}`);
    await adminPage.getByRole('button', { name: 'Add Question' }).first().click();

    const modal = adminPage.locator('[aria-label="Add question"]');
    await expect(modal).toBeVisible();

    await modal.locator('#q-type').selectOption('coding');
    await modal.locator('#q-content').fill(
      'Write a function `add(a, b)` that returns the sum.',
    );
    await modal.locator('#q-starter-code').fill('def add(a, b):\n    pass\n');

    await modal.locator('#lang-python').check();
    await modal.locator('#lang-javascript').check();

    await modal.getByRole('button', { name: 'Add Question' }).click();

    await expect(modal).not.toBeVisible();
    await expect(adminPage.getByText('Q4: coding')).toBeVisible();
    await expect(adminPage.getByText('python, javascript')).toBeVisible();
  });

  test('delete a question', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}`);

    const deleteButtons = adminPage.getByRole('button', { name: 'Delete question' });
    await expect(deleteButtons.first()).toBeVisible();
    const questionCount = await deleteButtons.count();

    await deleteButtons.last().click();

    await expect(deleteButtons).toHaveCount(questionCount - 1);
  });

  test('markdown preview works', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}`);
    await adminPage.getByRole('button', { name: 'Add Question' }).first().click();

    const modal = adminPage.locator('[aria-label="Add question"]');
    await expect(modal).toBeVisible();

    await modal.locator('#q-content').fill('# Hello World\n\nThis is **bold**.');
    await modal.getByText('Show Preview').click();

    await expect(modal.locator('h1:has-text("Hello World")')).toBeVisible();
    await expect(modal.locator('strong:has-text("bold")')).toBeVisible();

    await modal.getByText('Cancel').click();
  });
});
