import { classroomDb, cleanText, jsonError } from '@/lib/db';

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await context.params;
  const code = rawCode.toUpperCase();
  const raw: unknown = await request.json().catch(() => ({}));
  const body: Record<string, unknown> = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const name = cleanText(body.name, 24);
  if (name.length < 2) return jsonError('이름을 2자 이상 입력해 주세요.');

  const db = classroomDb();
  const session = await db.prepare('SELECT status FROM sessions WHERE code = ?').bind(code).first<{ status: string }>();
  if (!session) return jsonError('세션을 찾을 수 없습니다.', 404);
  if (session.status === 'ended') return jsonError('종료된 수업입니다.', 409);

  const id = crypto.randomUUID();
  const now = Date.now();
  await db.prepare('INSERT INTO participants (id, session_code, name, joined_at, last_seen) VALUES (?, ?, ?, ?, ?)')
    .bind(id, code, name, now, now).run();
  return Response.json({ participantId: id, code, status: session.status });
}
