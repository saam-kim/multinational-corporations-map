import { classroomDb, cleanText, jsonError } from '@/lib/db';

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await context.params;
  const code = rawCode.toUpperCase();
  const raw: unknown = await request.json().catch(() => ({}));
  const body: Record<string, unknown> = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const participantId = cleanText(body.participantId, 80);
  if (!participantId) return jsonError('학생 정보가 없습니다.', 401);

  const result = await classroomDb().prepare(`UPDATE participants SET
    company_id = ?, hub_id = ?, role_guess = ?, role_correct = ?, inference = ?, evidence_open = ?, quiz_score = ?, last_seen = ?
    WHERE id = ? AND session_code = ?`)
    .bind(
      cleanText(body.companyId, 40) || null,
      cleanText(body.hubId, 80) || null,
      cleanText(body.roleGuess, 20) || null,
      body.roleCorrect ? 1 : 0,
      cleanText(body.inference, 700) || null,
      body.evidenceOpen ? 1 : 0,
      Number.isFinite(body.quizScore) ? Math.max(0, Math.min(10, Number(body.quizScore))) : 0,
      Date.now(), participantId, code,
    ).run();
  return result.meta.changes ? Response.json({ ok: true }) : jsonError('참여 학생을 찾을 수 없습니다.', 404);
}
