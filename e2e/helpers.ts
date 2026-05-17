import type { Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

export async function dismissNextJsOverlay(page: Page): Promise<void> {
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

export async function loginOnPage(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await dismissNextJsOverlay(page);
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(/\/dashboard/);
}

export async function setMonacoEditorContent(
  page: Page,
  content: string,
): Promise<void> {
  await page.locator('.monaco-editor').waitFor({ state: 'visible' });
  await page.waitForFunction(
    () => !!(window as any).monaco?.editor?.getModels?.()?.length,
  );
  await page.evaluate((code) => {
    const model = (window as any).monaco.editor.getModels()[0];
    model.setValue(code);
  }, content);
}

export async function createTestViaApi(
  page: Page,
  title: string,
  timeLimitMinutes = 60,
): Promise<{ id: string; title: string }> {
  const response = await page.request.post(`${BASE_URL}/api/tests`, {
    data: { title, description: `E2E test: ${title}`, timeLimitMinutes },
  });
  return response.json();
}

export async function addQuestionViaApi(
  page: Page,
  testId: string,
  question: {
    type: 'multiple_choice' | 'free_text' | 'coding';
    content: string;
    options?: { text: string; isCorrect: boolean }[];
    allowMultiple?: boolean;
    points?: number;
    starterCode?: string;
    allowedLanguages?: string[];
    orderIndex?: number;
  },
): Promise<{ id: string }> {
  const response = await page.request.post(`${BASE_URL}/api/questions`, {
    data: { testId, ...question },
  });
  return response.json();
}

export async function createInvitationViaApi(
  page: Page,
  testId: string,
  candidateName: string,
  candidateEmail: string,
): Promise<{ id: string; token: string }> {
  const response = await page.request.post(`${BASE_URL}/api/invitations`, {
    data: { testId, candidateName, candidateEmail },
  });
  return response.json();
}

export async function createFullTestWithQuestions(
  page: Page,
  title: string,
  timeLimitMinutes = 60,
): Promise<{ testId: string; questionIds: string[] }> {
  const test = await createTestViaApi(page, title, timeLimitMinutes);

  const mcQ = await addQuestionViaApi(page, test.id, {
    type: 'multiple_choice',
    content: 'What is 2 + 2?',
    options: [
      { text: '3', isCorrect: false },
      { text: '4', isCorrect: true },
      { text: '5', isCorrect: false },
    ],
    points: 5,
    orderIndex: 0,
  });

  const ftQ = await addQuestionViaApi(page, test.id, {
    type: 'free_text',
    content: 'Explain the difference between `let` and `const` in JavaScript.',
    points: 10,
    orderIndex: 1,
  });

  const codeQ = await addQuestionViaApi(page, test.id, {
    type: 'coding',
    content: 'Write a function that returns the sum of two numbers.',
    starterCode: '# Write your solution here\n',
    allowedLanguages: ['python', 'javascript'],
    points: 20,
    orderIndex: 2,
  });

  return { testId: test.id, questionIds: [mcQ.id, ftQ.id, codeQ.id] };
}
