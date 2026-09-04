import { classroomDb, cleanText } from '@/lib/db';

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function sessionCode() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join('');
}

export async function POST(request: Request) {
  const raw: unknown = await request.json().catch(() => ({}));
  const body: Record<string, unknown> = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const title = cleanText(body.title, 80) || '다국적 기업의 공간적 분업';
  const db = classroomDb();
  const now = Date.now();
  const teacherKey = crypto.randomUUID();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const code = sessionCode();
    try {
      await db.prepare('INSERT INTO sessions (code, teacher_key, title, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(code, teacherKey, title, 'waiting', now, now).run();
      return Response.json({ code, teacherKey });
    } catch (error) {
      if (attempt === 3) throw error;
    }
  }

  return Response.json({ error: '세션을 만들지 못했습니다.' }, { status: 500 });
}
