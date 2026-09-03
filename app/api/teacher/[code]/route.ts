import { classroomDb, cleanText, jsonError } from '@/lib/db';

async function authorize(code: string, key: string) {
  return classroomDb().prepare('SELECT * FROM sessions WHERE code = ? AND teacher_key = ?').bind(code, key).first<Record<string, unknown>>();
}

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await context.params;
  const code = rawCode.toUpperCase();
  const key = new URL(request.url).searchParams.get('key') ?? '';
  const session = await authorize(code, key);
  if (!session) return jsonError('교사 관리 링크가 올바르지 않습니다.', 403);
  const participants = await classroomDb().prepare(`SELECT id, name, company_id AS companyId, hub_id AS hubId,
    role_guess AS roleGuess, role_correct AS roleCorrect, inference, evidence_open AS evidenceOpen,
    quiz_score AS quizScore, feedback, joined_at AS joinedAt, last_seen AS lastSeen
    FROM participants WHERE session_code = ? ORDER BY joined_at ASC`).bind(code).all();
  return Response.json({ session, participants: participants.results });
}

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await context.params;
  const code = rawCode.toUpperCase();
  const body = await request.json().catch(() => ({}));
  const key = cleanText(body.key, 80);
  if (!await authorize(code, key)) return jsonError('교사 관리 링크가 올바르지 않습니다.', 403);
  const db = classroomDb();

  if (body.action === 'status') {
    const status = ['waiting', 'active', 'paused', 'ended'].includes(body.status) ? body.status : 'waiting';
    await db.prepare('UPDATE sessions SET status = ?, updated_at = ? WHERE code = ?').bind(status, Date.now(), code).run();
  } else if (body.action === 'message') {
    await db.prepare('UPDATE sessions SET message = ?, updated_at = ? WHERE code = ?').bind(cleanText(body.message, 240) || null, Date.now(), code).run();
  } else if (body.action === 'focus') {
    await db.prepare('UPDATE sessions SET focus_company = ?, focus_hub = ?, updated_at = ? WHERE code = ?')
      .bind(cleanText(body.companyId, 40) || null, cleanText(body.hubId, 80) || null, Date.now(), code).run();
  } else if (body.action === 'feedback') {
    await db.prepare('UPDATE participants SET feedback = ? WHERE id = ? AND session_code = ?')
      .bind(cleanText(body.feedback, 300) || null, cleanText(body.participantId, 80), code).run();
  } else {
    return jsonError('지원하지 않는 관리 작업입니다.');
  }
  return Response.json({ ok: true });
}
