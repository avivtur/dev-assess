import { test, expect } from './fixtures';
import { createTestViaApi } from './helpers';

test.describe('Question Management', () => {
  let testId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@devassess.com');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/dashboard/);

    const t = await createTestViaApi(page, `E2E Questions Test ${Date.now()}`);
    testId = t.id;
    await page.close();
  });

  test('add MC question (single select)', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}`);
    await adminPage.getByRole('button', { name: 'Add Question' }).click();

    await adminPage.locator('#q-type').selectOption('multiple_choice');
    await adminPage.locator('#q-content').fill('What color is the sky?');

    const options = adminPage.locator('[placeholder^="Option"]');
    await options.nth(0).fill('Red');
    await options.nth(1).fill('Blue');
    await adminPage.getByText('Add Option').click();
    await options.nth(2).fill('Green');

    await adminPage.locator('#opt-correct-1').check();

    await adminPage.getByRole('button', { name: 'Add Question' }).last().click();

    await expect(adminPage.getByText('Q1: multiple choice')).toBeVisible();
    await expect(adminPage.getByText('Blue (correct)')).toBeVisible();
  });

  test('add MC question (multi select)', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}`);
    await adminPage.getByRole('button', { name: 'Add Question' }).first().click();

    await adminPage.locator('#q-type').selectOption('multiple_choice');
    await adminPage.locator('#q-content').fill('Which are programming languages?');
    await adminPage.locator('#q-allow-multi').check();

    const options = adminPage.locator('[placeholder^="Option"]');
    await options.nth(0).fill('Python');
    await options.nth(1).fill('HTML');

    await adminPage.locator('#opt-correct-0').check();

    await adminPage.getByRole('button', { name: 'Add Question' }).last().click();

    await expect(adminPage.getByText('Q2: multiple choice')).toBeVisible();
  });

  test('add free text question', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}`);
    await adminPage.getByRole('button', { name: 'Add Question' }).first().click();

    await adminPage.locator('#q-type').selectOption('free_text');
    await adminPage.locator('#q-content').fill(
      '## Explain\n\nDescribe the `async/await` pattern in JavaScript.',
    );

    await adminPage.getByRole('button', { name: 'Add Question' }).last().click();

    await expect(adminPage.getByText('Q3: free text')).toBeVisible();
  });

  test('add coding question', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}`);
    await adminPage.getByRole('button', { name: 'Add Question' }).first().click();

    await adminPage.locator('#q-type').selectOption('coding');
    await adminPage.locator('#q-content').fill(
      'Write a function `add(a, b)` that returns the sum.',
    );
    await adminPage.locator('#q-starter-code').fill('def add(a, b):\n    pass\n');

    await adminPage.locator('#lang-python').check();
    await adminPage.locator('#lang-javascript').check();

    await adminPage.getByRole('button', { name: 'Add Question' }).last().click();

    await expect(adminPage.getByText('Q4: coding')).toBeVisible();
    await expect(adminPage.getByText('python, javascript')).toBeVisible();
  });

  test('delete a question', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}`);

    const questionCount = await adminPage.getByText(/^Q\d+:/).count();

    await adminPage
      .getByRole('button', { name: 'Delete question' })
      .last()
      .click();

    const newCount = await adminPage.getByText(/^Q\d+:/).count();
    expect(newCount).toBe(questionCount - 1);
  });

  test('markdown preview works', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}`);
    await adminPage.getByRole('button', { name: 'Add Question' }).first().click();

    await adminPage.locator('#q-content').fill('# Hello World\n\nThis is **bold**.');
    await adminPage.getByText('Show Preview').click();

    await expect(adminPage.locator('h1:has-text("Hello World")')).toBeVisible();
    await expect(adminPage.locator('strong:has-text("bold")')).toBeVisible();

    await adminPage.getByText('Cancel').click();
  });
});
