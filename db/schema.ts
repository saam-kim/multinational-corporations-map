import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const sessions = sqliteTable('sessions', {
  code: text('code').primaryKey(),
  teacherKey: text('teacher_key').notNull(),
  title: text('title').notNull(),
  status: text('status').notNull().default('waiting'),
  focusCompany: text('focus_company'),
  focusHub: text('focus_hub'),
  message: text('message'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const participants = sqliteTable('participants', {
  id: text('id').primaryKey(),
  sessionCode: text('session_code').notNull().references(() => sessions.code),
  name: text('name').notNull(),
  companyId: text('company_id'),
  hubId: text('hub_id'),
  roleGuess: text('role_guess'),
  roleCorrect: integer('role_correct').notNull().default(0),
  inference: text('inference'),
  evidenceOpen: integer('evidence_open').notNull().default(0),
  quizScore: integer('quiz_score').notNull().default(0),
  feedback: text('feedback'),
  joinedAt: integer('joined_at').notNull(),
  lastSeen: integer('last_seen').notNull(),
}, (table) => [
  index('idx_participants_session_code').on(table.sessionCode),
  index('idx_participants_session_last_seen').on(table.sessionCode, table.lastSeen),
]);
