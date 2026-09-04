import { updateActivity } from '@/lib/classroom';
import { readBody, respond } from '@/lib/api';
export const runtime = 'nodejs';
export async function POST(request: Request, context: {params: Promise<{code: string}>}) {
  return respond(async () => updateActivity((await context.params).code.toUpperCase(), await readBody(request)));
}
