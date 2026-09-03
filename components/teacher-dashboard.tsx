'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ArrowRight, Check, Clipboard, Clock3, Globe2, MessageSquareText, Pause, Play, Radio, RefreshCw, Send, Square, Users } from 'lucide-react';
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

  async function action(payload: Record<string, unknown>) {
    const response = await fetch(`/api/teacher/${code}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, key: teacherKey }) });
    if (response.ok) await load();
  }

  const selectedCompany = companies.find((item) => item.id === focusCompany) ?? companies[0];
  const activeCount = data?.participants.filter((item) => Date.now() - item.lastSeen < 15000).length ?? 0;
  const roleCount = data?.participants.filter((item) => item.roleCorrect).length ?? 0;
  const evidenceCount = data?.participants.filter((item) => item.evidenceOpen).length ?? 0;

  if (error) return <main className="teacher-error"><Globe2 /><h1>대시보드에 접근할 수 없습니다</h1><p>{error}</p></main>;

  return <main className="teacher-shell">
    <header className="teacher-topbar"><div className="brand-lockup"><div className="brand-mark"><Globe2 /></div><div><div className="brand-title">GLOBAL SHIFT</div><div className="brand-subtitle">교사 수업 대시보드</div></div></div><div className={`live-status ${data?.session.status ?? 'waiting'}`}><Radio />{statusText[data?.session.status ?? 'waiting']}</div></header>
    <section className="teacher-layout">
      <aside className="session-sidebar">
        <span className="dashboard-kicker">CLASS SESSION</span><h1>{data?.session.title ?? '수업 준비 중'}</h1>
        <div className="session-code"><span>학생 입장 코드</span><strong>{code}</strong></div>
        <div className="qr-frame">{qrUrl && <img src={qrUrl} alt={`수업 코드 ${code} 입장 QR`} />}</div>
        <p className="join-url">{joinUrl}</p><Button variant="outline" className="copy-link" onClick={() => navigator.clipboard.writeText(joinUrl)}><Clipboard /> 입장 링크 복사</Button>
        <div className="session-actions"><Button onClick={() => action({ action: 'status', status: 'active' })}><Play /> 수업 시작</Button><Button variant="outline" onClick={() => action({ action: 'status', status: 'paused' })}><Pause /> 잠시 멈춤</Button><Button variant="outline" onClick={() => action({ action: 'status', status: 'ended' })}><Square /> 수업 종료</Button></div>
      </aside>

      <section className="dashboard-main">
        <div className="dashboard-heading"><div><span>LIVE CLASSROOM</span><h2>학생 활동 현황</h2></div><Button variant="outline" onClick={() => load()}><RefreshCw /> 새로고침</Button></div>
        <div className="metric-grid"><article><Users /><div><strong>{data?.participants.length ?? 0}</strong><span>입장 학생</span></div></article><article><Radio /><div><strong>{activeCount}</strong><span>현재 활동 중</span></div></article><article><Check /><div><strong>{roleCount}</strong><span>역할 추론 완료</span></div></article><article><MessageSquareText /><div><strong>{evidenceCount}</strong><span>근거 확인 완료</span></div></article></div>

        <div className="teacher-tools">
          <article><div className="tool-title"><MessageSquareText /><strong>전체 안내</strong></div><div className="tool-row"><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="학생 화면 상단에 보낼 안내" /><Button onClick={() => action({ action: 'message', message })}><Send /> 보내기</Button></div></article>
          <article><div className="tool-title"><Globe2 /><strong>함께 볼 거점 지정</strong></div><div className="tool-row"><select value={focusCompany} onChange={(event) => { const company = companies.find((item) => item.id === event.target.value) ?? companies[0]; setFocusCompany(company.id); setFocusHub(company.hubs[0].id); }}>{companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select value={focusHub} onChange={(event) => setFocusHub(event.target.value)}>{selectedCompany.hubs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><Button onClick={() => action({ action: 'focus', companyId: focusCompany, hubId: focusHub })}>화면 이동 <ArrowRight /></Button></div></article>
        </div>

        <div className="student-board"><div className="board-header"><span>학생</span><span>현재 활동</span><span>추론 내용</span><span>개별 피드백</span></div>{data?.participants.length ? data.participants.map((student) => { const company = companies.find((item) => item.id === student.companyId); const hub = company?.hubs.find((item) => item.id === student.hubId); return <article key={student.id} className="student-row"><div className="student-identity"><strong>{student.name}</strong><span><Clock3 /> {Date.now() - student.lastSeen < 15000 ? '접속 중' : '잠시 자리 비움'}</span></div><div className="student-progress"><strong>{company?.name ?? '탐색 전'}</strong><span>{hub?.name ?? '거점 선택 전'}</span><i>{student.evidenceOpen ? '근거 확인 완료' : student.roleCorrect ? '이유 작성 중' : student.roleGuess ? '역할 재추론' : '단서 확인 중'}</i></div><p className="student-inference">{student.inference || '아직 작성하지 않았습니다.'}</p><div className="feedback-cell"><textarea value={feedbackDrafts[student.id] ?? student.feedback ?? ''} onChange={(event) => setFeedbackDrafts((value) => ({ ...value, [student.id]: event.target.value }))} placeholder="짧은 피드백" /><Button size="sm" onClick={() => action({ action: 'feedback', participantId: student.id, feedback: feedbackDrafts[student.id] ?? student.feedback ?? '' })}>전송</Button></div></article>; }) : <div className="empty-class"><Users /><strong>아직 입장한 학생이 없습니다</strong><p>학생들이 QR 코드를 스캔하면 이곳에 바로 표시됩니다.</p></div>}</div>
      </section>
    </section>
  </main>;
}
