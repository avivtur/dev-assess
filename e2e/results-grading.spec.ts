import { test, expect, ADMIN_CREDS, RECRUITER_CREDS } from './fixtures';
import {
  createFullTestWithQuestions,
  createInvitationViaApi,
  dismissNextJsOverlay,
  loginOnPage,
  setMonacoEditorContent,
} from './helpers';

test.describe('Results and Grading', () => {
  let testId: string;
  let submittedToken: string;

  test.beforeAll(async ({ browser }) => {
    const adminPage = await browser.newPage();
    await loginOnPage(adminPage, ADMIN_CREDS.email, ADMIN_CREDS.password);

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

    const candidatePage = await browser.newPage();
    await dismissNextJsOverlay(candidatePage);
    await candidatePage.goto(`/test/${submittedToken}`);
    await candidatePage.getByRole('button', { name: 'Start Test' }).click();
    await expect(candidatePage.getByText('Question 1 of 3')).toBeVisible();

    // Q1: MC - select correct answer "4" (option index 1)
    await candidatePage.locator('#option-1').check();

    // Trigger a paste event for integrity testing
    await candidatePage.evaluate(() => {
      const dt = new DataTransfer();
      dt.setData('text/plain', 'pasted content for integrity test');
      document.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }),
      );
    });

    await candidatePage.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(candidatePage.getByText('Question 2 of 3')).toBeVisible();

    // Q2: Free text
    await candidatePage
      .getByPlaceholder('Type your answer here...')
      .fill('let is reassignable, const is not.');

    await candidatePage.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(candidatePage.getByText('Question 3 of 3')).toBeVisible();

    // Q3: Coding - write some code
    await setMonacoEditorContent(candidatePage, 'def add(a, b):\n    return a + b');

    // Submit
    await candidatePage.getByRole('button', { name: 'Submit Test' }).click();
    const modal = candidatePage.locator('[aria-label="Confirm submission"]');
    await expect(modal).toBeVisible();
    await modal.getByRole('button', { name: 'Submit' }).click();
    await candidatePage.waitForSelector('text=Thank You');
    await candidatePage.close();
  });

  test('results table shows submission', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}/results`);

    await expect(adminPage.getByText('Results Candidate')).toBeVisible();
    await expect(
      adminPage.getByText('results-candidate@test.com'),
    ).toBeVisible();
    await expect(adminPage.getByText('submitted', { exact: true })).toBeVisible();
  });

  test('auto-score for MC is correct', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}/results`);

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

    const scoreInputs = adminPage.locator('input[type="number"]');

    const firstScoreInput = scoreInputs.first();
    await firstScoreInput.clear();
    await firstScoreInput.fill('8');
    await firstScoreInput.press('Enter');

    await adminPage.waitForTimeout(1000);

    await adminPage.goto(`/tests/${testId}/results`);
    await expect(adminPage.getByText('manual: 8')).toBeVisible();
  });

  test('total score is auto + manual', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}/results`);

    await expect(adminPage.getByText('13 (auto: 5')).toBeVisible();
  });

  test('recruiter can view results', async ({ recruiterPage }) => {
    await recruiterPage.goto(`/tests/${testId}/results`);

    await expect(recruiterPage.getByText('Results Candidate')).toBeVisible();
    await expect(recruiterPage.getByRole('heading', { name: 'Test Results' })).toBeVisible();
  });
});
