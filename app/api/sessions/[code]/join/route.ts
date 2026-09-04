import { joinSession, cleanText } from '@/lib/classroom';
import { readBody, respond } from '@/lib/api';
export const runtime = 'nodejs';
export async function POST(request: Request, context: {params: Promise<{code: string}>}) {
  return respond(async () => joinSession((await context.params).code.toUpperCase(), cleanText((await readBody(request)).name, 24)));
}
