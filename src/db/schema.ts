import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'manager',
  'recruiter',
]);

export const questionTypeEnum = pgEnum('question_type', [
  'multiple_choice',
  'free_text',
  'coding',
]);

export const invitationStatusEnum = pgEnum('invitation_status', [
  'pending',
  'in_progress',
  'submitted',
  'expired',
]);

export const integrityEventTypeEnum = pgEnum('integrity_event_type', [
  'paste',
  'focus_loss',
]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull().default('recruiter'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tests = pgTable('tests', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  timeLimitMinutes: integer('time_limit_minutes').notNull().default(60),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  isActive: boolean('is_active').notNull().default(true),
});

export type McOption = {
  text: string;
  isCorrect: boolean;
};

export const questions = pgTable('questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  testId: uuid('test_id')
    .notNull()
    .references(() => tests.id, { onDelete: 'cascade' }),
  type: questionTypeEnum('type').notNull(),
  content: text('content').notNull(),
  options: jsonb('options').$type<McOption[]>(),
  allowMultiple: boolean('allow_multiple').notNull().default(false),
  points: integer('points').notNull().default(1),
  starterCode: text('starter_code'),
  allowedLanguages: jsonb('allowed_languages').$type<string[]>(),
  orderIndex: integer('order_index').notNull().default(0),
});

const DEFAULT_EXPIRY_DAYS = 7;

export const invitations = pgTable('invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  testId: uuid('test_id')
    .notNull()
    .references(() => tests.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  candidateName: text('candidate_name').notNull(),
  candidateEmail: text('candidate_email').notNull(),
  token: text('token').notNull().unique(),
  status: invitationStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at')
    .notNull()
    .$defaultFn(
      () =>
        new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    ),
});

export const submissions = pgTable('submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  invitationId: uuid('invitation_id')
    .notNull()
    .unique()
    .references(() => invitations.id),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  submittedAt: timestamp('submitted_at'),
  autoSubmitted: boolean('auto_submitted').notNull().default(false),
  autoScore: integer('auto_score').notNull().default(0),
  manualScore: integer('manual_score').notNull().default(0),
});

export const answers = pgTable('answers', {
  id: uuid('id').defaultRandom().primaryKey(),
  submissionId: uuid('submission_id')
    .notNull()
    .references(() => submissions.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id')
    .notNull()
    .references(() => questions.id),
  answerContent: text('answer_content'),
  codeOutput: text('code_output'),
  selectedLanguage: text('selected_language'),
  selectedOptions: jsonb('selected_options').$type<number[]>(),
  isCorrect: boolean('is_correct'),
  awardedPoints: integer('awarded_points'),
});

export const integrityEvents = pgTable('integrity_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  submissionId: uuid('submission_id')
    .notNull()
    .references(() => submissions.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id')
    .notNull()
    .references(() => questions.id),
  eventType: integrityEventTypeEnum('event_type').notNull(),
  occurredAt: timestamp('occurred_at').defaultNow().notNull(),
  detail: text('detail'),
});
