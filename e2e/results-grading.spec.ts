import { test, expect, ADMIN_CREDS, RECRUITER_CREDS } from './fixtures';
import {
  createFullTestWithQuestions,
  createInvitationViaApi,
} from './helpers';

test.describe('Results and Grading', () => {
  let testId: string;
  let submittedToken: string;

  test.beforeAll(async ({ browser }) => {
    // --- Admin: create test + invitation ---
    const adminPage = await browser.newPage();
    await adminPage.goto('/login');
    await adminPage.getByLabel('Email').fill(ADMIN_CREDS.email);
    await adminPage.getByLabel('Password').fill(ADMIN_CREDS.password);
    await adminPage.getByRole('button', { name: 'Sign In' }).click();
    await adminPage.waitForURL(/\/dashboard/);

    const result = await createFullTestWithQuestions(
      adminPage,
      `E2E Results Test ${Date.now()}`,
    );
    testId = result.testId;

    const inv = await createInvitationViaApi(
      adminPage,
      testId,
      'Results Candidate',
      'results-candidate@test.com',
    );
    submittedToken = inv.token;
    await adminPage.close();

    // --- Candidate: take the test ---
    const candidatePage = await browser.newPage();
    await candidatePage.goto(`/test/${submittedToken}`);
    await candidatePage.getByRole('button', { name: 'Start Test' }).click();

    // Q1: MC - select correct answer "4"
    await candidatePage.getByLabel('4').check();

    // Trigger a paste event for integrity testing
    await candidatePage.evaluate(() => {
      const dt = new DataTransfer();
      dt.setData('text/plain', 'pasted content for integrity test');
      document.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }),
      );
    });

    await candidatePage.getByRole('button', { name: 'Next' }).click();

    // Q2: Free text
    await candidatePage
      .getByPlaceholder('Type your answer here...')
      .fill('let is reassignable, const is not.');

    await candidatePage.getByRole('button', { name: 'Next' }).click();

    // Q3: Coding - just write some code
    const editor = candidatePage.locator('.monaco-editor textarea');
    await editor.focus();
    await editor.fill('def add(a, b):\n    return a + b');

    // Submit
    await candidatePage.getByRole('button', { name: 'Submit Test' }).click();
    await candidatePage.getByRole('button', { name: 'Submit' }).click();
    await candidatePage.waitForSelector('text=Thank You');
    await candidatePage.close();
  });

  test('results table shows submission', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}/results`);

    await expect(adminPage.getByText('Results Candidate')).toBeVisible();
    await expect(
      adminPage.getByText('results-candidate@test.com'),
    ).toBeVisible();
    await expect(adminPage.getByText('submitted')).toBeVisible();
  });

  test('auto-score for MC is correct', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}/results`);

    // MC question was worth 5 points, answered correctly
    await expect(adminPage.getByText('auto: 5')).toBeVisible();
  });

  test('integrity flags displayed', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}/results`);

    await expect(adminPage.getByText(/paste/i)).toBeVisible();
  });

  test('review submission detail', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}/results`);

    await adminPage.getByRole('link', { name: 'Review' }).first().click();

    await expect(adminPage.getByText('Submission Review')).toBeVisible();
    await expect(adminPage.getByText('Results Candidate')).toBeVisible();
    await expect(adminPage.getByText('Q1:')).toBeVisible();
    await expect(adminPage.getByText('Q2:')).toBeVisible();
    await expect(adminPage.getByText('Q3:')).toBeVisible();
  });

  test('MC answer shows correct marking', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}/results`);
    await adminPage.getByRole('link', { name: 'Review' }).first().click();

    await expect(adminPage.getByText('Correct').first()).toBeVisible();
  });

  test('free text answer is displayed', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}/results`);
    await adminPage.getByRole('link', { name: 'Review' }).first().click();

    await expect(
      adminPage.getByText('let is reassignable, const is not.'),
    ).toBeVisible();
  });

  test('coding answer shown in Monaco', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}/results`);
    await adminPage.getByRole('link', { name: 'Review' }).first().click();

    await expect(adminPage.locator('.monaco-editor')).toBeVisible();
  });

  test('manual grading updates score', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}/results`);
    await adminPage.getByRole('link', { name: 'Review' }).first().click();

    // Find the free text question's score input (Q2) and set it to 8
    const scoreInputs = adminPage.locator('input[type="number"]');

    // The first NumberInput for non-MC questions should be for Q2 (free text)
    const firstScoreInput = scoreInputs.first();
    await firstScoreInput.clear();
    await firstScoreInput.fill('8');
    await firstScoreInput.press('Enter');

    await adminPage.waitForTimeout(1000);

    // Go back to results to check updated score
    await adminPage.goto(`/tests/${testId}/results`);
    await expect(adminPage.getByText('manual: 8')).toBeVisible();
  });

  test('total score is auto + manual', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}/results`);

    // auto: 5, manual: 8, total: 13
    await expect(adminPage.getByText('13 (auto: 5')).toBeVisible();
  });

  test('recruiter can view results', async ({ recruiterPage }) => {
    await recruiterPage.goto(`/tests/${testId}/results`);

    await expect(recruiterPage.getByText('Results Candidate')).toBeVisible();
    await expect(recruiterPage.getByText('Test Results')).toBeVisible();
  });
});
