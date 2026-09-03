'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Building2, Check, ChevronRight, Factory, FlaskConical, Globe2, GraduationCap, Lightbulb, Loader2, Maximize2, Minimize2, Radio, RotateCcw, Sparkles, Trophy, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress';
import { companies, locationQuizzes } from '@/lib/companies';
import worldAtlas from 'world-atlas/countries-50m.json';
import { geoEquirectangular, geoGraticule10, geoInterpolate, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

type Hub = { id: string; name: string; country: string; lat: number; lng: number; type: string; typeLabel: string; color: string; summary: string; reasons: { title: string; detail: string }[]; textbookPoint: string };

const roleOptions = [
  { key: 'assembly', label: '조립·생산', icon: Factory },
  { key: 'rd', label: '연구개발', icon: FlaskConical },
  { key: 'resource', label: '자원·첨단부품', icon: Sparkles },
  { key: 'market', label: '판매·물류', icon: Globe2 },
];

function roleKey(type: string) {
  if (type === 'rd') return 'rd';
  if (type === 'assembly') return 'assembly';
  if (type === 'fab' || type === 'mine') return 'resource';
  return 'market';
}

const hubMeta: Record<string, { label: string; icon: typeof Factory; color: string }> = {
  rd: { label: '연구개발', icon: FlaskConical, color: '#7c3aed' },
  assembly: { label: '조립·생산', icon: Factory, color: '#ea580c' },
  fab: { label: '첨단부품·자원', icon: Sparkles, color: '#0d9488' },
  mine: { label: '자원 채굴', icon: Sparkles, color: '#0d9488' },
  trade: { label: '무역·판매', icon: Globe2, color: '#2563eb' },
  logistics: { label: '물류·판매', icon: Globe2, color: '#2563eb' },
};

function project(lat: number, lng: number) { return { x: ((lng + 180) / 360) * 1000, y: ((90 - lat) / 180) * 500 }; }

function routePath(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const interpolate = geoInterpolate([from.lng, from.lat], [to.lng, to.lat]);
  return Array.from({ length: 33 }, (_, index) => {
    const point = interpolate(index / 32);
    const projected = mapProjection(point);
    return projected ? `${index ? 'L' : 'M'}${projected[0].toFixed(1)},${projected[1].toFixed(1)}` : '';
  }).join(' ');
}

const mapProjection = geoEquirectangular().scale(159.154943).translate([500, 250]);
const mapPath = geoPath(mapProjection);
const countryFeatures = (feature(worldAtlas as never, worldAtlas.objects.countries as never) as unknown as { features: Array<{ id?: string | number; properties?: { name?: string } }> }).features;
const graticulePath = mapPath(geoGraticule10()) ?? undefined;

export default function Home() {
  const [companyId, setCompanyId] = useState(companies[0].id);
  const company = companies.find((item) => item.id === companyId) ?? companies[0];
  const hubs = company.hubs as Hub[];
  const [hubId, setHubId] = useState(hubs[0].id);
  const hub = hubs.find((item) => item.id === hubId) ?? hubs[0];
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [roleGuess, setRoleGuess] = useState<string | null>(null);
  const [inference, setInference] = useState('');
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [sessionCode, setSessionCode] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [classroom, setClassroom] = useState<{ status: string; message?: string | null; feedback?: string | null; focusCompany?: string | null; focusHub?: string | null } | null>(null);
  const quiz = locationQuizzes[questionIndex];
  const finished = questionIndex >= locationQuizzes.length;
  const progress = finished ? 100 : ((questionIndex + 1) / locationQuizzes.length) * 100;

  const pinPoints = useMemo(() => [{ id: `${company.id}-hq`, name: company.headquarters.city, type: 'hq', typeLabel: '본사 · 의사결정', ...project(company.headquarters.lat, company.headquarters.lng) }, ...hubs.map((item) => ({ ...item, ...project(item.lat, item.lng) }))], [company, hubs]);

  const correctRole = roleKey(hub.type);
  const roleCorrect = roleGuess === correctRole;

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('session')?.toUpperCase() ?? '';
    if (!code) return;
    setSessionCode(code);
    setParticipantId(sessionStorage.getItem(`global-shift-${code}`) ?? '');
  }, []);

  useEffect(() => {
    if (!sessionCode) return;
    let stopped = false;
    const load = async () => {
      const suffix = participantId ? `?participantId=${encodeURIComponent(participantId)}` : '';
      const response = await fetch(`/api/sessions/${sessionCode}${suffix}`);
      if (!response.ok || stopped) return;
      const data = await response.json();
      setClassroom(data);
      if (data.focusCompany && data.focusCompany !== companyId) {
        const focused = companies.find((item) => item.id === data.focusCompany);
        if (focused) { setCompanyId(focused.id); setHubId(data.focusHub && focused.hubs.some((item) => item.id === data.focusHub) ? data.focusHub : focused.hubs[0].id); setRoleGuess(null); setInference(''); setEvidenceOpen(false); }
      } else if (data.focusHub && data.focusHub !== hubId && hubs.some((item) => item.id === data.focusHub)) {
        selectHub(data.focusHub);
      }
    };
    load();
    const timer = window.setInterval(load, 4000);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [sessionCode, participantId, companyId, hubId]);

  useEffect(() => {
    if (!sessionCode || !participantId) return;
    const timer = window.setTimeout(() => {
      fetch(`/api/sessions/${sessionCode}/activity`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ participantId, companyId, hubId, roleGuess, roleCorrect, inference, evidenceOpen, quizScore: score }) }).catch(() => undefined);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [sessionCode, participantId, companyId, hubId, roleGuess, roleCorrect, inference, evidenceOpen, score]);

  function selectHub(id: string) { setHubId(id); setRoleGuess(null); setInference(''); setEvidenceOpen(false); }
  function selectCompany(id: string) { const next = companies.find((item) => item.id === id) ?? companies[0]; setCompanyId(id); selectHub(next.hubs[0].id); }
  function submitAnswer(optionIndex: number) { if (answer !== null || finished) return; setAnswer(optionIndex); if (optionIndex === quiz.answerIndex) setScore((value) => value + 1); }
  function nextQuestion() { setQuestionIndex((value) => value + 1); setAnswer(null); }
  function restartQuiz() { setQuestionIndex(0); setAnswer(null); setScore(0); }
  async function createSession() {
    setCreatingSession(true);
    const response = await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: '다국적 기업의 공간적 분업' }) });
    const data = await response.json();
    setCreatingSession(false);
    if (response.ok) window.location.assign(`/teacher/${data.code}?key=${encodeURIComponent(data.teacherKey)}`);
  }
  async function joinClass() {
    if (joinName.trim().length < 2) { setJoinError('이름을 2자 이상 입력해 주세요.'); return; }
    setJoining(true); setJoinError('');
    const response = await fetch(`/api/sessions/${sessionCode}/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: joinName }) });
    const data = await response.json();
    setJoining(false);
    if (!response.ok) { setJoinError(data.error ?? '입장하지 못했습니다.'); return; }
    sessionStorage.setItem(`global-shift-${sessionCode}`, data.participantId);
    setParticipantId(data.participantId);
  }
  async function togglePresentation() {
    const next = !presentationMode;
    setPresentationMode(next);
    try {
      if (next && !document.fullscreenElement) await document.documentElement.requestFullscreen();
      if (!next && document.fullscreenElement) await document.exitFullscreen();
    } catch { /* 브라우저가 전체 화면을 막아도 발표용 레이아웃은 유지합니다. */ }
  }

  return (
    <main className={`learning-shell ${presentationMode ? 'presentation-mode' : ''}`}>
      <header className="topbar">
        <div className="brand-lockup"><div className="brand-mark"><Globe2 /></div><div><div className="brand-title">GLOBAL SHIFT</div><div className="brand-subtitle">다국적 기업의 공간적 분업</div></div></div>
        <div className="topbar-actions">{sessionCode && participantId ? <span className="session-badge"><Radio /> {sessionCode} 수업 참여 중</span> : <Button variant="outline" className="header-button teacher-entry" onClick={createSession} disabled={creatingSession}>{creatingSession ? <Loader2 className="spin" /> : <Users />} 교사 세션 만들기</Button>}<span className="course-badge"><GraduationCap /> 통합사회 II</span><Button variant="outline" className="header-button" onClick={togglePresentation}>{presentationMode ? <Minimize2 /> : <Maximize2 />} {presentationMode ? '발표 종료' : '발표 화면'}</Button><Button className="quiz-button" onClick={() => setQuizOpen(true)}><Trophy /> {locationQuizzes.length}문제 도전</Button></div>
      </header>

      {sessionCode && participantId && classroom?.message && <div className="teacher-message"><Radio /><strong>교사 안내</strong><span>{classroom.message}</span></div>}
      {sessionCode && participantId && classroom?.feedback && <div className="personal-feedback"><Check /><strong>교사 피드백</strong><span>{classroom.feedback}</span></div>}
      {sessionCode && participantId && classroom && classroom.status !== 'active' && <div className="classroom-gate"><div><Radio /><span>{classroom.status === 'waiting' ? '수업 시작을 기다리고 있어요' : classroom.status === 'paused' ? '교사가 잠시 활동을 멈췄어요' : '수업이 종료되었습니다'}</span><p>{classroom.status === 'waiting' ? '이 화면을 그대로 두면 수업이 시작될 때 자동으로 열립니다.' : '교사의 안내를 확인해 주세요.'}</p></div></div>}

      <section className="company-strip" aria-label="기업 선택">
        <div className="strip-intro"><span>대륙별 대표 기업</span><strong>7개의 공급망을 비교해 보세요</strong></div>
        <div className="company-tabs">
          {companies.map((item, index) => <button key={item.id} className={`company-tab ${item.id === company.id ? 'active' : ''}`} onClick={() => selectCompany(item.id)} aria-pressed={item.id === company.id}><span className="company-index">0{index + 1}</span><span className="company-flag">{item.flag}</span><span><strong>{item.name}</strong><small>{item.continent}</small></span></button>)}
        </div>
      </section>

      <section className="workspace">
        <aside className="company-panel">
          <div className="company-kicker"><span>{company.flag}</span>{company.continent}</div><h1>{company.name}</h1><p className="company-english">{company.engName}</p><p className="company-category">{company.category}</p>
          <div className="hq-card"><div className="hq-icon"><Building2 /></div><div><span>GLOBAL HQ</span><strong>{company.headquarters.city}</strong></div></div>
          <p className="strategy-copy">{company.overview.spatialDivisionSummary}</p>
          <button className="text-action" onClick={() => setOverviewOpen(true)}>기업 전략 전체 보기 <ArrowRight /></button>
          <div className="flow-mini"><span>기획·설계</span><ChevronRight /><span>부품</span><ChevronRight /><span>조립</span><ChevronRight /><span>시장</span></div>
          <div className="inquiry-card"><span><BookOpen /> 오늘의 탐구 질문</span><p>{company.overview.curriculumQuestion}</p></div>
        </aside>

        <section className="map-stage" aria-label={`${company.name} 글로벌 거점 지도`}>
          <div className="map-heading"><div><span>GLOBAL FOOTPRINT</span><h2>{company.name}의 가치사슬은 어디에 놓여 있을까?</h2><div className="learning-steps" aria-label="학습 순서"><span className="done">1 기업 선택</span><i /><span className="active">2 지역 단서</span><i /><span>3 역할 추론</span><i /><span>4 이유 작성</span></div></div><div className="map-count"><strong>{hubs.length + 1}</strong><span>글로벌 핵심 거점</span></div></div>
          <div className="map-canvas"><div className="map-grid" />
            <svg viewBox="0 0 1000 500" className="world-map" role="img" aria-label="국가별 경계가 표시된 세계 지도">
              <defs><filter id="land-shadow" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#25443a" floodOpacity=".18" /></filter></defs>
              <path d={graticulePath} className="map-graticule" />
              <g className="country-layer" filter="url(#land-shadow)">
                {countryFeatures.map((country, index) => <path key={`${country.id ?? 'country'}-${index}`} d={mapPath(country as never) ?? undefined} className={`country-shape country-tone-${index % 4}`}><title>{country.properties?.name ?? '국가'}</title></path>)}
              </g>
              <g className="route-layer" aria-hidden="true">
                {hubs.map((item) => <path key={item.id} d={routePath(company.headquarters, item)} className={`supply-route ${item.id === hub.id ? 'active' : ''}`} />)}
              </g>
              {pinPoints.map((point) => { const active = point.id === hub.id; const isHq = point.type === 'hq'; const revealed = active && roleCorrect; return <g key={point.id} className={`map-pin ${active ? 'active' : ''} ${isHq ? 'hq' : ''}`} transform={`translate(${point.x} ${point.y})`} onClick={() => !isHq && selectHub(point.id)} role="button" tabIndex={isHq ? -1 : 0} aria-label={isHq ? `${point.name}, 본사` : `${point.name}, 역할 추론이 필요한 거점`} onKeyDown={(event) => { if (!isHq && (event.key === 'Enter' || event.key === ' ')) selectHub(point.id); }}><circle r="17" className="pin-hit" />{active && <circle r="19" className="pin-pulse" />}<circle r={isHq ? 8 : 6.5} fill={isHq ? '#111827' : revealed ? hubMeta[point.type]?.color ?? '#2563eb' : '#5d746b'} /><circle r={isHq ? 3 : 2.4} fill="white" />{(active || isHq) && <text x="12" y="4">{isHq ? 'HQ' : point.name}</text>}</g>; })}
            </svg>
            <div className="active-hub-badge"><span>{hub.country}</span><strong>{hub.name}</strong></div>
            <div className="map-source">NATURAL EARTH · 50m · {countryFeatures.length}개 국가·지역 경계</div>
            <div className="map-legend"><span><i className="legend-hq" /> 본사</span><span><i className="legend-rd" /> R&D</span><span><i className="legend-assembly" /> 조립·생산</span><span><i className="legend-resource" /> 첨단부품·자원</span></div>
            <div className="hub-dock" role="list" aria-label="글로벌 거점 목록">{hubs.map((item, index) => { const meta = hubMeta[item.type] ?? hubMeta.trade; const Icon = roleCorrect && item.id === hub.id ? meta.icon : Lightbulb; return <button key={item.id} role="listitem" className={`hub-chip ${item.id === hub.id ? 'active' : ''}`} onClick={() => selectHub(item.id)}><span className="hub-number">{String(index + 1).padStart(2, '0')}</span><span className="hub-role" style={{ color: roleCorrect && item.id === hub.id ? meta.color : '#667970' }}><Icon /> {roleCorrect && item.id === hub.id ? meta.label : '역할 추론'}</span><strong>{item.name}</strong></button>; })}</div>
          </div>
        </section>

        <aside className="detail-panel">
          <div className="detail-topline"><span style={{ color: roleCorrect ? hubMeta[hub.type]?.color ?? '#2563eb' : '#667970' }}>{roleCorrect ? hubMeta[hub.type]?.label ?? hub.typeLabel : '역할 추론 중'}</span><span>{hub.country}</span></div><h2>{hub.name}</h2>{roleCorrect && <p className="hub-summary">{hub.summary}</p>}
          <div className="why-heading"><span>REGIONAL CLUES</span><strong>지역 단서 수집</strong></div>
          <p className="clue-guide">아래 특징을 읽고, 이 기업이 왜 이곳에 거점을 두었는지 먼저 추론해 보세요.</p>
          <div className="clue-list">{hub.reasons.map((reason, index) => <article key={reason.title} className="clue-card"><span>단서 {String(index + 1).padStart(2, '0')}</span><strong>{reason.title}</strong></article>)}</div>
          <div className="role-inference"><span className="inference-step">STEP 1</span><strong>이 지역은 어떤 역할을 담당할까?</strong><div className="role-options">{roleOptions.map((option) => { const Icon = option.icon; const selected = roleGuess === option.key; const wrong = selected && !roleCorrect; return <button key={option.key} className={`${selected ? 'selected' : ''} ${wrong ? 'wrong' : ''}`} onClick={() => { setRoleGuess(option.key); setInference(''); setEvidenceOpen(false); }}><Icon /><span>{option.label}</span>{selected && roleCorrect && <Check />}</button>; })}</div>{roleGuess && !roleCorrect && <p className="role-feedback wrong">단서와 역할의 관계를 다시 살펴보세요.</p>}{roleCorrect && <p className="role-feedback correct"><Check /> 역할을 찾았어요. 이제 그 이유를 설명해 보세요.</p>}</div>
          {roleCorrect && <div className="inference-box">
            <span className="inference-step">STEP 2</span><label htmlFor="inference"><Lightbulb /> 그 역할을 맡은 이유는?</label>
            <p>지역 단서를 근거로 {company.name}가 이곳에 {hubMeta[hub.type]?.label ?? hub.typeLabel} 기능을 둔 이유를 써 보세요.</p>
            <textarea id="inference" value={inference} onChange={(event) => { setInference(event.target.value); setEvidenceOpen(false); }} placeholder="예: ○○가 풍부해 △△ 비용을 낮출 수 있기 때문이다." rows={3} />
            <div><span>{inference.trim().length < 8 ? '8자 이상 생각을 적어 보세요' : '좋아요. 이제 근거와 비교해 보세요.'}</span><Button disabled={inference.trim().length < 8} onClick={() => setEvidenceOpen(true)}>근거 확인 <ArrowRight /></Button></div>
          </div>}
          {evidenceOpen && <div className="evidence-reveal" aria-live="polite"><div className="evidence-title"><Check /><span>근거와 비교하기</span></div><div className="reason-list">{hub.reasons.map((reason, index) => <article key={reason.title} className="reason-card"><span>0{index + 1}</span><div><strong>{reason.title}</strong><p>{reason.detail}</p></div></article>)}</div><div className="textbook-point"><div><GraduationCap /><span>교과서 개념 연결</span></div><p>{hub.textbookPoint}</p></div></div>}
          <Button variant={evidenceOpen ? 'default' : 'outline'} className="next-hub" onClick={() => { const index = hubs.findIndex((item) => item.id === hub.id); selectHub(hubs[(index + 1) % hubs.length].id); }}>{evidenceOpen ? '다음 거점 탐색' : '다른 거점 먼저 보기'} <ArrowRight /></Button>
        </aside>
      </section>

      <footer className="concept-footer"><span className="footer-label">CORE CONCEPT</span><p><strong>공간적 분업</strong>은 기능을 가장 유리한 지역에 나누어 배치하는 전략입니다.</p><div className="concept-flow"><span>본사 <small>의사결정</small></span><ArrowRight /><span>R&D <small>인재·클러스터</small></span><ArrowRight /><span>생산 <small>비용·정책</small></span><ArrowRight /><span>시장 <small>판매·물류</small></span></div></footer>

      <Dialog open={overviewOpen} onOpenChange={setOverviewOpen}><DialogContent className="overview-dialog"><DialogHeader><DialogDescription>{company.continent} · {company.category}</DialogDescription><DialogTitle>{company.flag} {company.name} <small>{company.engName}</small></DialogTitle></DialogHeader><div className="overview-stats"><div><span>설립</span><strong>{company.overview.founded}</strong></div><div><span>본사</span><strong>{company.headquarters.country}</strong></div><div><span>글로벌 규모</span><strong>{company.overview.globalScale}</strong></div></div><p className="overview-summary">{company.overview.spatialDivisionSummary}</p><div className="feature-grid">{company.overview.keyFeatures.map((feature, index) => <article key={feature.title}><span>0{index + 1}</span><strong>{feature.title}</strong><p>{feature.text}</p></article>)}</div></DialogContent></Dialog>

      <Dialog open={quizOpen} onOpenChange={setQuizOpen}><DialogContent className="quiz-dialog" showCloseButton={false}><div className="quiz-header"><div><span>LOCATION QUIZ</span><strong>입지 전략 챌린지</strong></div><Button variant="ghost" size="icon" onClick={() => setQuizOpen(false)} aria-label="퀴즈 닫기"><X /></Button></div><Progress value={progress} className="quiz-progress"><ProgressLabel>{finished ? '완료' : `${questionIndex + 1} / ${locationQuizzes.length}`}</ProgressLabel><ProgressValue>{Math.round(progress)}%</ProgressValue></Progress>
        {finished ? <div className="quiz-result"><div className="result-medal"><Trophy /></div><span>학습 완료</span><h2>{score} / {locationQuizzes.length}</h2><p>{score >= 8 ? '공간적 분업의 원리를 정확히 이해했어요!' : '지도의 거점을 다시 살펴보면 입지 요인이 더 선명해질 거예요.'}</p><Button onClick={restartQuiz}><RotateCcw /> 다시 도전</Button></div> : <div className="quiz-body"><div className="quiz-question"><span>Q{String(questionIndex + 1).padStart(2, '0')}</span><h2>{quiz.question}</h2></div><div className="quiz-options">{quiz.options.map((option, index) => { const correct = answer !== null && index === quiz.answerIndex; const wrong = answer === index && index !== quiz.answerIndex; return <button key={option} className={`${correct ? 'correct' : ''} ${wrong ? 'wrong' : ''}`} onClick={() => submitAnswer(index)}><span>{String.fromCharCode(65 + index)}</span><p>{option}</p>{correct && <Check />}</button>; })}</div>{answer !== null && <div className={`quiz-feedback ${answer === quiz.answerIndex ? 'correct' : 'wrong'}`}><strong>{answer === quiz.answerIndex ? '정답이에요!' : '핵심 개념을 다시 확인해 봐요.'}</strong><p>{quiz.explanation}</p><Button onClick={nextQuestion}>다음 문제 <ArrowRight /></Button></div>}</div>}
      </DialogContent></Dialog>

      <Dialog open={Boolean(sessionCode && !participantId)}><DialogContent className="join-dialog" showCloseButton={false}><DialogHeader><DialogDescription>수업 코드 {sessionCode}</DialogDescription><DialogTitle>학생으로 입장하기</DialogTitle></DialogHeader><p>대시보드에 표시할 이름을 입력해 주세요.</p><label htmlFor="student-name">이름</label><input id="student-name" value={joinName} onChange={(event) => setJoinName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') joinClass(); }} placeholder="예: 2학년 3반 김민지" autoFocus />{joinError && <span className="join-error">{joinError}</span>}<Button onClick={joinClass} disabled={joining}>{joining ? <Loader2 className="spin" /> : <ArrowRight />} 수업 입장</Button></DialogContent></Dialog>
    </main>
  );
}
