import type { Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

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
