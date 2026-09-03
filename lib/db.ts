import { env } from 'cloudflare:workers';

export type ClassroomDb = D1Database;

export function classroomDb() {
  return (env as unknown as { DB: ClassroomDb }).DB;
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function cleanText(value: unknown, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
