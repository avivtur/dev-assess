import { test, expect, ADMIN_CREDS } from './fixtures';
import {
  createFullTestWithQuestions,
  createInvitationViaApi,
  dismissNextJsOverlay,
  loginOnPage,
  setMonacoEditorContent,
} from './helpers';

test.describe('Invitation and Candidate Flow', () => {
  let testId: string;
  let invitationToken: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginOnPage(page, ADMIN_CREDS.email, ADMIN_CREDS.password);

    const result = await createFullTestWithQuestions(
      page,
      `E2E Candidate Flow ${Date.now()}`,
    );
    testId = result.testId;

    const invitation = await createInvitationViaApi(
      page,
      testId,
      'Jane Doe',
      'jane@example.com',
    );
    invitationToken = invitation.token;
    await page.close();
  });

  test('generate invitation link via UI', async ({ adminPage }) => {
    await adminPage.goto(`/tests/${testId}/invite`);

    await adminPage.locator('#inv-name').fill('UI Invite Test');
    await adminPage.locator('#inv-email').fill('ui-invite@example.com');
    await adminPage.getByRole('button', { name: 'Generate Link' }).click();

    await expect(adminPage.getByText('Invitation link created')).toBeVisible();
    await expect(adminPage.getByText('/test/')).toBeVisible();
  });

  test('candidate sees landing page', async ({ page }) => {
    await page.goto(`/test/${invitationToken}`);

    await expect(page.getByRole('heading', { name: /E2E Candidate Flow/ })).toBeVisible();
    await expect(page.getByText(/Questions:.*3/)).toBeVisible();
    await expect(page.getByText('60 minutes')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Test' })).toBeVisible();
  });

  test('start test and timer begins', async ({ page }) => {
    await page.goto(`/test/${invitationToken}`);
    await page.getByRole('button', { name: 'Start Test' }).click();

    await expect(page.getByText('Question 1 of 3')).toBeVisible();
    await expect(page.getByText(/\d{2}:\d{2}/)).toBeVisible();
  });

  test('navigate between questions', async ({ page }) => {
    await page.goto(`/test/${invitationToken}`);

    await expect(page.getByText('Question 1 of 3')).toBeVisible();

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByText('Question 2 of 3')).toBeVisible();

    await page.getByRole('button', { name: 'Previous', exact: true }).click();
    await expect(page.getByText('Question 1 of 3')).toBeVisible();

    await page.getByRole('button', { name: '3', exact: true }).click();
    await expect(page.getByText('Question 3 of 3')).toBeVisible();
  });

  test('answer MC question and verify persistence', async ({ page }) => {
    await page.goto(`/test/${invitationToken}`);

    await expect(page.getByText('Question 1 of 3')).toBeVisible();

    await page.locator('#option-1').check();

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByText('Question 2 of 3')).toBeVisible();

    await page.getByRole('button', { name: 'Previous', exact: true }).click();
    await expect(page.locator('#option-1')).toBeChecked();
  });

  test('answer free text question and verify persistence', async ({ page }) => {
    await page.goto(`/test/${invitationToken}`);

    await page.getByRole('button', { name: '2', exact: true }).click();
    await expect(page.getByText('Question 2 of 3')).toBeVisible();

    const textarea = page.getByPlaceholder('Type your answer here...');
    await textarea.fill('let is block-scoped and reassignable, const is block-scoped but not reassignable.');

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Previous', exact: true }).click();

    await expect(textarea).toHaveValue(/let is block-scoped/);
  });

  test('answer coding question and run code', async ({ page }) => {
    await page.goto(`/test/${invitationToken}`);

    await page.getByRole('button', { name: '3', exact: true }).click();
    await expect(page.getByText('Question 3 of 3')).toBeVisible();

    await setMonacoEditorContent(page, 'print("hello world")');

    await page.getByRole('button', { name: 'Run' }).click();

    await expect(page.getByText('hello world')).toBeVisible({ timeout: 15000 });
  });

  test('submit test manually', async ({ page }) => {
    await page.goto(`/test/${invitationToken}`);

    await page.getByRole('button', { name: '3', exact: true }).click();
    await page.getByRole('button', { name: 'Submit Test' }).click();

    const modal = page.locator('[aria-label="Confirm submission"]');
    await expect(modal).toBeVisible();
    await modal.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByText('Thank You')).toBeVisible();
  });

  test('link is dead after submission', async ({ page }) => {
    await page.goto(`/test/${invitationToken}`);
    await expect(page.getByText('Thank You')).toBeVisible();
  });

  test('auto-submit on timer expiry', async ({ browser }) => {
    const adminPage = await browser.newPage();
    await loginOnPage(adminPage, ADMIN_CREDS.email, ADMIN_CREDS.password);

    const result = await createFullTestWithQuestions(
      adminPage,
      `Timer Test ${Date.now()}`,
      1,
    );
    const inv = await createInvitationViaApi(
      adminPage,
      result.testId,
      'Timer User',
      'timer@test.com',
    );
    await adminPage.close();

    const page = await browser.newPage();
    await dismissNextJsOverlay(page);
    await page.clock.install();
    await page.goto(`/test/${inv.token}`);
    await page.getByRole('button', { name: 'Start Test' }).click();

    await expect(page.getByText('Question 1 of 3')).toBeVisible();

    await page.clock.fastForward('02:00');

    await expect(page.getByText('Thank You')).toBeVisible({ timeout: 10000 });
    await page.close();
  });

  test('paste detection shows warning', async ({ browser }) => {
    const adminPage = await browser.newPage();
    await loginOnPage(adminPage, ADMIN_CREDS.email, ADMIN_CREDS.password);

    const result = await createFullTestWithQuestions(
      adminPage,
      `Paste Test ${Date.now()}`,
    );
    const inv = await createInvitationViaApi(
      adminPage,
      result.testId,
      'Paste User',
      'paste@test.com',
    );
    await adminPage.close();

    const page = await browser.newPage();
    await dismissNextJsOverlay(page);
    await page.goto(`/test/${inv.token}`);
    await page.getByRole('button', { name: 'Start Test' }).click();
    await expect(page.getByText('Question 1 of 3')).toBeVisible();

    await page.evaluate(() => {
      const dt = new DataTransfer();
      dt.setData('text/plain', 'copied answer');
      document.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }),
      );
    });

    await expect(page.getByText('Paste detected')).toBeVisible();
    await page.close();
  });

  test('tab switch detection records event', async ({ browser }) => {
    const adminPage = await browser.newPage();
    await loginOnPage(adminPage, ADMIN_CREDS.email, ADMIN_CREDS.password);

    const result = await createFullTestWithQuestions(
      adminPage,
      `TabSwitch Test ${Date.now()}`,
    );
    const inv = await createInvitationViaApi(
      adminPage,
      result.testId,
      'TabSwitch User',
      'tabswitch@test.com',
    );
    await adminPage.close();

    const page = await browser.newPage();
    await dismissNextJsOverlay(page);
    await page.goto(`/test/${inv.token}`);
    await page.getByRole('button', { name: 'Start Test' }).click();
    await expect(page.getByText('Question 1 of 3')).toBeVisible();

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        value: true,
        writable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await page.waitForTimeout(500);

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        value: false,
        writable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await page.close();
  });

  test('mobile warning is shown on small viewport', async ({ browser }) => {
    const adminPage = await browser.newPage();
    await loginOnPage(adminPage, ADMIN_CREDS.email, ADMIN_CREDS.password);

    const result = await createFullTestWithQuestions(
      adminPage,
      `Mobile Test ${Date.now()}`,
    );
    const inv = await createInvitationViaApi(
      adminPage,
      result.testId,
      'Mobile User',
      'mobile@test.com',
    );
    await adminPage.close();

    const context = await browser.newContext({
      viewport: { width: 600, height: 800 },
    });
    const page = await context.newPage();
    await dismissNextJsOverlay(page);
    await page.goto(`/test/${inv.token}`);

    await expect(page.getByText('Desktop recommended')).toBeVisible();
    await context.close();
  });
});
