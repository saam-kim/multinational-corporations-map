'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Building2, Check, ChevronRight, Factory, FlaskConical, Globe2, GraduationCap, Maximize2, RotateCcw, Sparkles, Trophy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress';
import { companies, locationQuizzes } from '@/lib/companies';
import worldAtlas from 'world-atlas/countries-110m.json';
import { geoEquirectangular, geoGraticule10, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

type Hub = { id: string; name: string; country: string; lat: number; lng: number; type: string; typeLabel: string; color: string; summary: string; reasons: { title: string; detail: string }[]; textbookPoint: string };

const hubMeta: Record<string, { label: string; icon: typeof Factory; color: string }> = {
  rd: { label: '연구개발', icon: FlaskConical, color: '#7c3aed' },
  assembly: { label: '조립·생산', icon: Factory, color: '#ea580c' },
  fab: { label: '첨단부품·자원', icon: Sparkles, color: '#0d9488' },
  mine: { label: '자원 채굴', icon: Sparkles, color: '#0d9488' },
  trade: { label: '무역·판매', icon: Globe2, color: '#2563eb' },
  logistics: { label: '물류·판매', icon: Globe2, color: '#2563eb' },
};

function project(lat: number, lng: number) { return { x: ((lng + 180) / 360) * 1000, y: ((90 - lat) / 180) * 500 }; }

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
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const quiz = locationQuizzes[questionIndex];
  const finished = questionIndex >= locationQuizzes.length;
  const progress = finished ? 100 : ((questionIndex + 1) / locationQuizzes.length) * 100;

  const pinPoints = useMemo(() => [{ id: `${company.id}-hq`, name: company.headquarters.city, type: 'hq', typeLabel: '본사 · 의사결정', ...project(company.headquarters.lat, company.headquarters.lng) }, ...hubs.map((item) => ({ ...item, ...project(item.lat, item.lng) }))], [company, hubs]);

  function selectCompany(id: string) { const next = companies.find((item) => item.id === id) ?? companies[0]; setCompanyId(id); setHubId(next.hubs[0].id); }
  function submitAnswer(optionIndex: number) { if (answer !== null || finished) return; setAnswer(optionIndex); if (optionIndex === quiz.answerIndex) setScore((value) => value + 1); }
  function nextQuestion() { setQuestionIndex((value) => value + 1); setAnswer(null); }
  function restartQuiz() { setQuestionIndex(0); setAnswer(null); setScore(0); }
  async function toggleFullscreen() { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); }

  return (
    <main className="learning-shell">
      <header className="topbar">
        <div className="brand-lockup"><div className="brand-mark"><Globe2 /></div><div><div className="brand-title">GLOBAL SHIFT</div><div className="brand-subtitle">다국적 기업의 공간적 분업</div></div></div>
        <div className="topbar-actions"><span className="course-badge"><GraduationCap /> 통합사회 II</span><Button variant="outline" className="header-button" onClick={toggleFullscreen}><Maximize2 /> 발표 화면</Button><Button className="quiz-button" onClick={() => setQuizOpen(true)}><Trophy /> 10문제 도전</Button></div>
      </header>

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
          <div className="map-heading"><div><span>GLOBAL FOOTPRINT</span><h2>{company.name}의 가치사슬은 어디에 놓여 있을까?</h2></div><div className="map-count"><strong>{hubs.length + 1}</strong><span>글로벌 핵심 거점</span></div></div>
          <div className="map-canvas"><div className="map-grid" />
            <svg viewBox="0 0 1000 500" className="world-map" role="img" aria-label="국가별 경계가 표시된 세계 지도">
              <defs><filter id="land-shadow" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#25443a" floodOpacity=".18" /></filter></defs>
              <path d={graticulePath} className="map-graticule" />
              <g className="country-layer" filter="url(#land-shadow)">
                {countryFeatures.map((country, index) => <path key={country.id ?? index} d={mapPath(country as never) ?? undefined} className={`country-shape country-tone-${index % 4}`}><title>{country.properties?.name ?? '국가'}</title></path>)}
              </g>
              {pinPoints.map((point) => { const active = point.id === hub.id; const isHq = point.type === 'hq'; return <g key={point.id} className={`map-pin ${active ? 'active' : ''} ${isHq ? 'hq' : ''}`} transform={`translate(${point.x} ${point.y})`} onClick={() => !isHq && setHubId(point.id)} role="button" tabIndex={isHq ? -1 : 0} aria-label={`${point.name}, ${point.typeLabel}`} onKeyDown={(event) => { if (!isHq && (event.key === 'Enter' || event.key === ' ')) setHubId(point.id); }}>{active && <circle r="19" className="pin-pulse" />}<circle r={isHq ? 8 : 6.5} fill={isHq ? '#111827' : hubMeta[point.type]?.color ?? '#2563eb'} /><circle r={isHq ? 3 : 2.4} fill="white" />{(active || isHq) && <text x="12" y="4">{isHq ? 'HQ' : point.name}</text>}</g>; })}
            </svg>
            <div className="map-source">NATURAL EARTH · 110m 국가 경계</div>
            <div className="map-legend"><span><i className="legend-hq" /> 본사</span><span><i className="legend-rd" /> R&D</span><span><i className="legend-assembly" /> 조립·생산</span><span><i className="legend-resource" /> 첨단부품·자원</span></div>
            <div className="hub-dock" role="list" aria-label="글로벌 거점 목록">{hubs.map((item, index) => { const meta = hubMeta[item.type] ?? hubMeta.trade; const Icon = meta.icon; return <button key={item.id} role="listitem" className={`hub-chip ${item.id === hub.id ? 'active' : ''}`} onClick={() => setHubId(item.id)}><span className="hub-number">{String(index + 1).padStart(2, '0')}</span><span className="hub-role" style={{ color: meta.color }}><Icon /> {meta.label}</span><strong>{item.name}</strong></button>; })}</div>
          </div>
        </section>

        <aside className="detail-panel">
          <div className="detail-topline"><span style={{ color: hubMeta[hub.type]?.color ?? '#2563eb' }}>{hubMeta[hub.type]?.label ?? hub.typeLabel}</span><span>{hub.country}</span></div><h2>{hub.name}</h2><p className="hub-summary">{hub.summary}</p>
          <div className="why-heading"><span>WHY HERE?</span><strong>왜 이 지역일까</strong></div>
          <div className="reason-list">{hub.reasons.map((reason, index) => <article key={reason.title} className="reason-card"><span>0{index + 1}</span><div><strong>{reason.title}</strong><p>{reason.detail}</p></div></article>)}</div>
          <div className="textbook-point"><div><GraduationCap /><span>교과서 개념 연결</span></div><p>{hub.textbookPoint}</p></div>
          <Button className="next-hub" onClick={() => { const index = hubs.findIndex((item) => item.id === hub.id); setHubId(hubs[(index + 1) % hubs.length].id); }}>다음 거점 탐색 <ArrowRight /></Button>
        </aside>
      </section>

      <footer className="concept-footer"><span className="footer-label">CORE CONCEPT</span><p><strong>공간적 분업</strong>은 기능을 가장 유리한 지역에 나누어 배치하는 전략입니다.</p><div className="concept-flow"><span>본사 <small>의사결정</small></span><ArrowRight /><span>R&D <small>인재·클러스터</small></span><ArrowRight /><span>생산 <small>비용·정책</small></span><ArrowRight /><span>시장 <small>판매·물류</small></span></div></footer>

      <Dialog open={overviewOpen} onOpenChange={setOverviewOpen}><DialogContent className="overview-dialog"><DialogHeader><DialogDescription>{company.continent} · {company.category}</DialogDescription><DialogTitle>{company.flag} {company.name} <small>{company.engName}</small></DialogTitle></DialogHeader><div className="overview-stats"><div><span>설립</span><strong>{company.overview.founded}</strong></div><div><span>본사</span><strong>{company.headquarters.country}</strong></div><div><span>글로벌 규모</span><strong>{company.overview.globalScale}</strong></div></div><p className="overview-summary">{company.overview.spatialDivisionSummary}</p><div className="feature-grid">{company.overview.keyFeatures.map((feature, index) => <article key={feature.title}><span>0{index + 1}</span><strong>{feature.title}</strong><p>{feature.text}</p></article>)}</div></DialogContent></Dialog>

      <Dialog open={quizOpen} onOpenChange={setQuizOpen}><DialogContent className="quiz-dialog" showCloseButton={false}><div className="quiz-header"><div><span>LOCATION QUIZ</span><strong>입지 전략 챌린지</strong></div><Button variant="ghost" size="icon" onClick={() => setQuizOpen(false)} aria-label="퀴즈 닫기"><X /></Button></div><Progress value={progress} className="quiz-progress"><ProgressLabel>{finished ? '완료' : `${questionIndex + 1} / ${locationQuizzes.length}`}</ProgressLabel><ProgressValue>{Math.round(progress)}%</ProgressValue></Progress>
        {finished ? <div className="quiz-result"><div className="result-medal"><Trophy /></div><span>학습 완료</span><h2>{score} / {locationQuizzes.length}</h2><p>{score >= 8 ? '공간적 분업의 원리를 정확히 이해했어요!' : '지도의 거점을 다시 살펴보면 입지 요인이 더 선명해질 거예요.'}</p><Button onClick={restartQuiz}><RotateCcw /> 다시 도전</Button></div> : <div className="quiz-body"><div className="quiz-question"><span>Q{String(questionIndex + 1).padStart(2, '0')}</span><h2>{quiz.question}</h2></div><div className="quiz-options">{quiz.options.map((option, index) => { const correct = answer !== null && index === quiz.answerIndex; const wrong = answer === index && index !== quiz.answerIndex; return <button key={option} className={`${correct ? 'correct' : ''} ${wrong ? 'wrong' : ''}`} onClick={() => submitAnswer(index)}><span>{String.fromCharCode(65 + index)}</span><p>{option}</p>{correct && <Check />}</button>; })}</div>{answer !== null && <div className={`quiz-feedback ${answer === quiz.answerIndex ? 'correct' : 'wrong'}`}><strong>{answer === quiz.answerIndex ? '정답이에요!' : '핵심 개념을 다시 확인해 봐요.'}</strong><p>{quiz.explanation}</p><Button onClick={nextQuestion}>다음 문제 <ArrowRight /></Button></div>}</div>}
      </DialogContent></Dialog>
    </main>
  );
}
