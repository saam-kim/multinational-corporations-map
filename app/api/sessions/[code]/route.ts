import { readSession } from '@/lib/classroom';
import { respond } from '@/lib/api';
export const runtime = 'nodejs';
export async function GET(request: Request, context: {params: Promise<{code: string}>}) {
  return respond(async () => readSession((await context.params).code.toUpperCase(), new URL(request.url).searchParams.get('participantId')));
}
