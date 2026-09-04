import { readDashboard, teacherAction } from '@/lib/classroom';
import { readBody, respond } from '@/lib/api';
export const runtime = 'nodejs';
export async function GET(request: Request, context: {params: Promise<{code: string}>}) {
  return respond(async () => readDashboard((await context.params).code.toUpperCase(), new URL(request.url).searchParams.get('key') ?? ''));
}
export async function POST(request: Request, context: {params: Promise<{code: string}>}) {
  return respond(async () => teacherAction((await context.params).code.toUpperCase(), await readBody(request)));
}
