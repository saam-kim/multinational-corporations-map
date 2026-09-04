import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { classroomDb } from './firebase-admin';
import { companies } from './companies';
import { expectedRole, emptyComparison } from './learning';

export class ClassroomError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export const cleanText = (value: unknown, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';
export const hashKey = (key: string) => createHash('sha256').update(key).digest('hex');
const validId = (id: string) => /^[0-9a-f-]{36}$/i.test(id);
function sessionRef(code: string) {
  if (!/^[A-Z2-9]{6}$/.test(code)) throw new ClassroomError('수업 코드를 확인해 주세요.', 404);
  return classroomDb().collection('sessions').doc(code);
}
function participantRef(code: string, id: string) {
  if (!validId(id)) throw new ClassroomError('학생 정보가 올바르지 않습니다.', 401);
  return sessionRef(code).collection('participants').doc(id);
}
type Session = {
  code: string; title: string; status: string; teacherKeyHash: string;
  focus_company: string | null; focus_hub: string | null; message: string | null;
  created_at: number; updated_at: number; participantCount: number;
};
function authorize(session: Session | undefined, key: string) {
  if (!session || !key || !session.teacherKeyHash) throw new ClassroomError('교사 관리 링크가 올바르지 않습니다.', 403);
  const expected = Buffer.from(session.teacherKeyHash, 'hex');
  const actual = Buffer.from(hashKey(key), 'hex');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new ClassroomError('교사 관리 링크가 올바르지 않습니다.', 403);
}
export async function createSession(title: string) {
  const db = classroomDb();
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = Array.from(randomBytes(6), n => alphabet[n % alphabet.length]).join('');
    const teacherKey = randomUUID();
    const now = Date.now();
    const created = await db.runTransaction(async tx => {
      const ref = sessionRef(code);
      if ((await tx.get(ref)).exists) return false;
      tx.create(ref, {code, title: title || '다국적 기업의 공간적 분업', status: 'waiting', teacherKeyHash: hashKey(teacherKey), focus_company: null, focus_hub: null, message: null, created_at: now, updated_at: now, participantCount: 0} satisfies Session);
      return true;
    });
    if (created) return {code, teacherKey};
  }
  throw new ClassroomError('세션을 만들지 못했습니다. 다시 시도해 주세요.', 503);
}
export async function readSession(code: string, participantId: string | null) {
  const snapshot = await sessionRef(code).get();
  if (!snapshot.exists) throw new ClassroomError('세션을 찾을 수 없습니다.', 404);
  const session = snapshot.data() as Session;
  let feedback: string | null = null;
  let work;
  if (participantId) {
    const participant = await participantRef(code, participantId).get();
    if (!participant.exists) throw new ClassroomError('참여 학생을 찾을 수 없습니다.', 404);
    feedback = participant.get('feedback') ?? null;
    work = {records: participant.get('records') ?? {}, comparison: participant.get('comparison') ?? emptyComparison};
  }
  return { code, title: session.title, status: session.status, focusCompany: session.focus_company, focusHub: session.focus_hub, message: session.message, updatedAt: session.updated_at, feedback, ...(work ? {work} : {}) };
}
export async function joinSession(code: string, name: string) {
  if (name.length < 2) throw new ClassroomError('이름을 2자 이상 입력해 주세요.');
  const ref = sessionRef(code);
  const id = randomUUID();
  // Optimistic compare-and-swap avoids holding a shared session lock while
  // several students join over the REST transport at once.
  for (let attempt = 0; attempt < 12; attempt++) {
    const snapshot = await ref.get();
    if (!snapshot.exists) throw new ClassroomError('세션을 찾을 수 없습니다.', 404);
    const session = snapshot.data() as Session;
    if (session.status === 'ended') throw new ClassroomError('종료된 수업입니다.', 409);
    if (session.participantCount >= 100) throw new ClassroomError('한 수업에는 최대 100명까지 참여할 수 있습니다.', 409);
    const now = Date.now();
    const batch = classroomDb().batch();
    batch.create(participantRef(code, id), {name, companyId: null, hubId: null, roleGuess: null, roleCorrect: 0, inference: null, evidenceOpen: 0, quizScore: 0, feedback: null, joinedAt: now, lastSeen: now});
    batch.update(ref, {participantCount: session.participantCount + 1}, {lastUpdateTime: snapshot.updateTime!});
    try {
      await batch.commit();
      return {participantId: id, code, status: session.status};
    } catch (error) {
      const failure = error as {code?: number; message?: string};
      const conflict = [9, 10].includes(Number(failure.code)) ||
        (failure.code === 400 && failure.message?.includes('FAILED_PRECONDITION'));
      if (!conflict) throw error;
      await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 120));
    }
  }
  throw new ClassroomError('입장이 몰리고 있습니다. 잠시 후 다시 시도해 주세요.', 503);
}
function validatedActivity(body: Record<string, unknown>) {
  const companyId = cleanText(body.companyId, 40);
  const hubId = cleanText(body.hubId, 80);
  const company = companies.find(item => item.id === companyId);
  const hub = company?.hubs.find(item => item.id === hubId);
  if (!company || !hub) throw new ClassroomError('기업과 거점 정보를 확인해 주세요.');
  const roleGuess = cleanText(body.roleGuess, 20) || null;
  if (roleGuess && !['assembly', 'rd', 'component', 'resource', 'market'].includes(roleGuess)) throw new ClassroomError('역할 선택을 확인해 주세요.');
  const expected = expectedRole(hub.type);
  const roleCorrect = roleGuess === expected ? 1 : 0;
  const inference = cleanText(body.inference, 700) || null;
  const clueIndex = Number.isInteger(body.clueIndex) && Number(body.clueIndex) >= 0 && Number(body.clueIndex) < hub.reasons.length ? Number(body.clueIndex) : -1;
  return { companyId, hubId, roleGuess, roleCorrect, inference: inference ?? '', clueIndex, revision: cleanText(body.revision, 700), helpRequested: body.helpRequested === true, evidenceOpen: body.evidenceOpen === true && roleGuess && clueIndex >= 0 && (inference?.length ?? 0) >= 8 ? 1 : 0, quizScore: Number.isFinite(body.quizScore) ? Math.max(0, Math.min(10, Math.floor(Number(body.quizScore)))) : 0, lastSeen: Date.now() };
}
export async function updateActivity(code: string, body: Record<string, unknown>) {
  const ref = sessionRef(code);
  const participant = participantRef(code, cleanText(body.participantId, 80));
  const activity = body.comparison ? null : validatedActivity(body);
  await classroomDb().runTransaction(async tx => {
    const [session, student] = await Promise.all([tx.get(ref), tx.get(participant)]);
    if (!session.exists || !student.exists) throw new ClassroomError('참여 학생을 찾을 수 없습니다.', 404);
    if (session.get('status') !== 'active') throw new ClassroomError('지금은 학생 활동 시간이 아닙니다.', 409);
    if (!activity) {
      const raw = body.comparison as Record<string, unknown>;
      const first = cleanText(raw.first, 80), second = cleanText(raw.second, 80);
      const records = student.get('records') ?? {};
      if ((first && !records[first]?.evidenceOpen) || (second && !records[second]?.evidenceOpen) || (first && first === second)) throw new ClassroomError('서로 다른 두 거점의 사례를 먼저 확인해 주세요.');
      tx.update(participant, {comparison:{first,second,explanation:cleanText(raw.explanation,1000),transfer:cleanText(raw.transfer,1000)},lastSeen:Date.now()});
    } else {
      const previous = student.get('records')?.[activity.hubId];
      const record = {...activity, evidenceOpen: Boolean(activity.evidenceOpen)};
      const firstSubmission = previous?.firstSubmission ?? (activity.evidenceOpen ? {roleGuess:activity.roleGuess,inference:activity.inference,clueIndex:activity.clueIndex} : null);
      tx.update(participant, {...activity, [`records.${activity.hubId}`]: {...record, firstSubmission}});
    }
  });
  return {ok: true};
}
export async function readDashboard(code: string, key: string) {
  const ref = sessionRef(code);
  const session = (await ref.get()).data() as Session | undefined;
  authorize(session, key);
  const students = await ref.collection('participants').orderBy('joinedAt').limit(100).get();
  // Never send the teacher credential or its hash to either client.
  const {teacherKeyHash: _secret, ...safeSession} = session!;
  return {session: safeSession, participants: students.docs.map(doc => ({id: doc.id, ...doc.data()}))};
}
export async function teacherAction(code: string, body: Record<string, unknown>) {
  const ref = sessionRef(code);
  await classroomDb().runTransaction(async tx => {
    const session = (await tx.get(ref)).data() as Session | undefined;
    authorize(session, cleanText(body.key, 80));
    const now = Date.now();
    if (body.action === 'status') {
      if (!['waiting', 'active', 'paused', 'ended'].includes(String(body.status))) throw new ClassroomError('수업 상태를 확인해 주세요.');
      tx.update(ref, {status: body.status, updated_at: now});
    } else if (body.action === 'message') {
      tx.update(ref, {message: cleanText(body.message, 240) || null, updated_at: now});
    } else if (body.action === 'focus') {
      const companyId = cleanText(body.companyId, 40);
      const hubId = cleanText(body.hubId, 80);
      if (companyId || hubId) {
        if (!companies.find(c => c.id === companyId)?.hubs.some(h => h.id === hubId)) throw new ClassroomError('기업과 거점을 확인해 주세요.');
      }
      tx.update(ref, {focus_company: companyId || null, focus_hub: hubId || null, updated_at: now});
    } else if (body.action === 'feedback') {
      const studentRef = participantRef(code, cleanText(body.participantId, 80));
      if (!(await tx.get(studentRef)).exists) throw new ClassroomError('참여 학생을 찾을 수 없습니다.', 404);
      tx.update(studentRef, {feedback: cleanText(body.feedback, 300) || null});
    } else throw new ClassroomError('지원하지 않는 관리 작업입니다.');
  });
  return {ok: true};
}
