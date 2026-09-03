import { classroomDb, jsonError } from '@/lib/db';

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const db = classroomDb();
  const normalizedCode = code.toUpperCase();
  const session = await db.prepare('SELECT code, title, status, focus_company AS focusCompany, focus_hub AS focusHub, message, updated_at AS updatedAt FROM sessions WHERE code = ?')
    .bind(normalizedCode).first<Record<string, unknown>>();
  if (!session) return jsonError('세션을 찾을 수 없습니다.', 404);
  const participantId = new URL(request.url).searchParams.get('participantId');
  const participant = participantId
    ? await db.prepare('SELECT feedback FROM participants WHERE id = ? AND session_code = ?').bind(participantId, normalizedCode).first()
    : null;
  return Response.json({ ...session, feedback: participant?.feedback ?? null });
}
