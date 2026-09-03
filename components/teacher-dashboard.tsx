'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ArrowRight, Check, Clipboard, Clock3, Globe2, MessageSquareText, Pause, Play, Radio, RefreshCw, RotateCcw, Send, Square, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { companies } from '@/lib/companies';

type Participant = { id: string; name: string; companyId?: string; hubId?: string; roleGuess?: string; roleCorrect: number; inference?: string; evidenceOpen: number; quizScore: number; feedback?: string; joinedAt: number; lastSeen: number };
type DashboardData = { session: { title: string; status: string; message?: string; focus_company?: string; focus_hub?: string }; participants: Participant[] };

const statusText: Record<string, string> = { waiting: '입장 대기', active: '수업 진행 중', paused: '활동 일시정지', ended: '수업 종료' };

export default function TeacherDashboard({ code }: { code: string }) {
  const [teacherKey, setTeacherKey] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [joinUrl, setJoinUrl] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [message, setMessage] = useState('');
  const [focusCompany, setFocusCompany] = useState(companies[0].id);
  const [focusHub, setFocusHub] = useState(companies[0].hubs[0].id);
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'all' | 'help' | 'working' | 'done'>('all');
  const [actionNote, setActionNote] = useState('');
  const [feedbackSent, setFeedbackSent] = useState<Record<string, boolean>>({});

  async function load(key = teacherKey) {
    if (!key) return;
    const response = await fetch(`/api/teacher/${code}?key=${encodeURIComponent(key)}`, { cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) { setError(body.error ?? '대시보드를 불러오지 못했습니다.'); return; }
    setData(body); setError('');
    if (body.session.message) setMessage(body.session.message);
    if (body.session.focus_company) {
      setFocusCompany(body.session.focus_company);
      if (body.session.focus_hub) setFocusHub(body.session.focus_hub);
    }
  }

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get('key') ?? '';
    const url = `${window.location.origin}/?session=${code}`;
    setTeacherKey(key); setJoinUrl(url);
    QRCode.toDataURL(url, { width: 360, margin: 2, color: { dark: '#153c32', light: '#ffffff' } }).then(setQrUrl);
    load(key);
    const timer = window.setInterval(() => load(key), 3000);
    return () => window.clearInterval(timer);
  }, [code]);

  async function action(payload: Record<string, unknown>, note?: string) {
    const response = await fetch(`/api/teacher/${code}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, key: teacherKey }) });
    if (response.ok) {
      if (payload.action === 'feedback' && typeof payload.participantId === 'string') setFeedbackSent((value) => ({ ...value, [payload.participantId as string]: true }));
      if (note) { setActionNote(note); window.setTimeout(() => setActionNote(''), 2600); }
      await load();
    }
  }

  const selectedCompany = companies.find((item) => item.id === focusCompany) ?? companies[0];
  const isRecent = (item: Participant) => Date.now() - item.lastSeen < 90000;
  const needsHelp = (item: Participant) => Boolean((item.roleGuess && !item.roleCorrect) || (item.roleCorrect && (!item.inference || item.inference.trim().length < 20 || !item.evidenceOpen)));
  const activeCount = data?.participants.filter(isRecent).length ?? 0;
  const roleCount = data?.participants.filter((item) => item.roleCorrect).length ?? 0;
  const evidenceCount = data?.participants.filter((item) => item.evidenceOpen).length ?? 0;
  const helpCount = data?.participants.filter(needsHelp).length ?? 0;
  const filteredParticipants = (data?.participants ?? []).filter((item) => filter === 'all' || (filter === 'help' && needsHelp(item)) || (filter === 'working' && !item.evidenceOpen) || (filter === 'done' && Boolean(item.evidenceOpen)));
  const focusedCompany = companies.find((item) => item.id === data?.session.focus_company);
  const focusedHub = focusedCompany?.hubs.find((item) => item.id === data?.session.focus_hub);

  if (error) return <main className="teacher-error"><Globe2 /><h1>대시보드에 접근할 수 없습니다</h1><p>{error}</p></main>;

  return <main className="teacher-shell">
    <header className="teacher-topbar"><div className="brand-lockup"><div className="brand-mark"><Globe2 /></div><div><div className="brand-title">GLOBAL SHIFT</div><div className="brand-subtitle">교사 수업 대시보드</div></div></div><div className={`live-status ${data?.session.status ?? 'waiting'}`}><Radio />{statusText[data?.session.status ?? 'waiting']}</div></header>
    <section className="teacher-layout">
      <aside className="session-sidebar">
        <span className="dashboard-kicker">CLASS SESSION</span><h1>{data?.session.title ?? '수업 준비 중'}</h1>
        <div className="session-code"><span>학생 입장 코드</span><strong>{code}</strong></div>
        <div className="qr-frame">{qrUrl && <img src={qrUrl} alt={`수업 코드 ${code} 입장 QR`} />}</div>
        <p className="join-url">{joinUrl}</p><Button variant="outline" className="copy-link" onClick={() => navigator.clipboard.writeText(joinUrl)}><Clipboard /> 입장 링크 복사</Button>
        <div className="session-actions"><Button onClick={() => action({ action: 'status', status: 'active' }, '학생 활동을 시작했습니다.')}><Play /> 수업 시작</Button><Button variant="outline" onClick={() => action({ action: 'status', status: 'paused' }, '학생 활동을 잠시 멈췄습니다.')}><Pause /> 잠시 멈춤</Button><Button variant="outline" onClick={() => action({ action: 'status', status: 'ended' }, '수업을 종료했습니다.')}><Square /> 수업 종료</Button></div>
      </aside>

      <section className="dashboard-main">
        <div className="dashboard-heading"><div><span>LIVE CLASSROOM</span><h2>학생 활동 현황</h2></div><Button variant="outline" onClick={() => load()}><RefreshCw /> 새로고침</Button></div>
        {actionNote && <div className="dashboard-notice" role="status"><Check /> {actionNote}</div>}
        <div className="metric-grid"><article><Users /><div><strong>{data?.participants.length ?? 0}</strong><span>입장 학생</span></div></article><article><Radio /><div><strong>{activeCount}</strong><span>최근 90초 활동</span></div></article><article><Check /><div><strong>{roleCount}</strong><span>역할 추론 완료</span></div></article><article><MessageSquareText /><div><strong>{evidenceCount}</strong><span>근거 확인 완료</span></div></article></div>

        <div className="teacher-tools">
          <article><div className="tool-title"><MessageSquareText /><strong>전체 안내</strong></div><div className="tool-row"><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="학생 화면 상단에 보낼 안내" /><Button onClick={() => action({ action: 'message', message }, '전체 안내를 학생 화면에 보냈습니다.')}><Send /> 보내기</Button></div></article>
          <article><div className="tool-title"><Globe2 /><strong>함께 볼 거점 지정</strong>{focusedHub && <span className="focus-live">현재 제어 중</span>}</div><div className="tool-row"><select value={focusCompany} onChange={(event) => { const company = companies.find((item) => item.id === event.target.value) ?? companies[0]; setFocusCompany(company.id); setFocusHub(company.hubs[0].id); }}>{companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select value={focusHub} onChange={(event) => setFocusHub(event.target.value)}>{selectedCompany.hubs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><Button onClick={() => action({ action: 'focus', companyId: focusCompany, hubId: focusHub }, '모든 학생 화면을 선택한 거점으로 이동했습니다.')}>화면 이동 <ArrowRight /></Button>{focusedHub && <Button variant="outline" aria-label="자율 탐색으로 전환" onClick={() => action({ action: 'focus', companyId: '', hubId: '' }, '학생 화면 제어를 해제했습니다.')}><RotateCcw /> 자율 탐색</Button>}</div>{focusedHub && <p className="focus-summary">학생 화면: {focusedCompany?.name} · {focusedHub.name}</p>}</article>
        </div>

        <div className="student-filters" aria-label="학생 진행 상태 필터"><div><strong>학생별 진행</strong><span>도움 필요 {helpCount}명</span></div><div>{([['all','전체'],['help','도움 필요'],['working','진행 중'],['done','완료']] as const).map(([key,label]) => <button key={key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>{label}{key === 'help' && helpCount > 0 ? ` ${helpCount}` : ''}</button>)}</div></div>
        <div className="student-board"><div className="board-header"><span>학생</span><span>현재 활동</span><span>추론 내용</span><span>개별 피드백</span></div>{filteredParticipants.length ? filteredParticipants.map((student) => { const company = companies.find((item) => item.id === student.companyId); const hub = company?.hubs.find((item) => item.id === student.hubId); return <article key={student.id} className={`student-row ${needsHelp(student) ? 'needs-help' : ''}`}><div className="student-identity"><strong>{student.name}</strong><span><Clock3 /> {isRecent(student) ? '최근 활동 감지' : '90초 이상 활동 없음'}</span>{needsHelp(student) && <em>교사 확인 권장</em>}</div><div className="student-progress"><strong>{company?.name ?? '탐색 전'}</strong><span>{hub?.name ?? '거점 선택 전'}</span><i>{student.evidenceOpen ? '근거 확인 완료' : student.roleCorrect ? '이유 작성 중' : student.roleGuess ? '역할 재추론' : '단서 확인 중'}</i></div><p className="student-inference">{student.inference || '아직 작성하지 않았습니다.'}</p><div className="feedback-cell"><textarea value={feedbackDrafts[student.id] ?? student.feedback ?? ''} onChange={(event) => { setFeedbackSent((value) => ({ ...value, [student.id]: false })); setFeedbackDrafts((value) => ({ ...value, [student.id]: event.target.value })); }} placeholder="짧은 피드백" /><Button size="sm" onClick={() => action({ action: 'feedback', participantId: student.id, feedback: feedbackDrafts[student.id] ?? student.feedback ?? '' }, `${student.name} 학생에게 피드백을 보냈습니다.`)}>{feedbackSent[student.id] ? <><Check /> 전송됨</> : '전송'}</Button></div></article>; }) : <div className="empty-class"><Users /><strong>{data?.participants.length ? '이 조건에 해당하는 학생이 없습니다' : '아직 입장한 학생이 없습니다'}</strong><p>{data?.participants.length ? '다른 필터를 선택해 보세요.' : '학생들이 QR 코드를 스캔하면 이곳에 바로 표시됩니다.'}</p></div>}</div>
      </section>
    </section>
  </main>;
}
