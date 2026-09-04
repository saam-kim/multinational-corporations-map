import { createSession, cleanText } from '@/lib/classroom';
import { readBody, respond } from '@/lib/api';
export const runtime = 'nodejs';
export async function POST(request: Request) { return respond(async () => createSession(cleanText((await readBody(request)).title, 80))); }
