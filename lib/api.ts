import { ClassroomError } from './classroom';
export async function readBody(request: Request): Promise<Record<string, unknown>> {
  const raw: unknown = await request.json().catch(() => null);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new ClassroomError('요청 내용을 확인해 주세요.');
  return raw as Record<string, unknown>;
}
export async function respond(task: () => Promise<unknown>) {
  try { return Response.json(await task(), {headers: {'Cache-Control': 'no-store'}}); }
  catch (error) {
    if (error instanceof ClassroomError) return Response.json({error: error.message}, {status: error.status, headers: {'Cache-Control': 'no-store'}});
    console.error('Classroom request failed', error instanceof Error ? error.name : 'UnknownError');
    return Response.json({error: '수업 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.'}, {status: 503, headers: {'Cache-Control': 'no-store'}});
  }
}
