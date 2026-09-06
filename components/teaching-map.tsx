'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Download,
  Link2,
  Maximize2,
  Minimize2,
  Printer,
  ArrowRight,
  RotateCcw,
  Globe2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { companies } from '@/lib/companies';
import { companyReferences, evidenceFor } from '@/lib/teaching-evidence';
import {
  comparisonHub,
  connectionConcept,
  connectionQuestion,
} from '@/lib/teaching-flow';
import worldAtlas from 'world-atlas/countries-50m.json';
import { geoEquirectangular, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import './teaching-map.css';

const projection = geoEquirectangular().scale(159.154943).translate([500, 250]);
const path = geoPath(projection);
const countries = (
  feature(
    worldAtlas as never,
    worldAtlas.objects.countries as never,
  ) as unknown as { features: { id?: string | number }[] }
).features;
const steps = ['지역 단서', '기능 공개', '이유 공개'];
const shortName = (name: string) => name.replace(/\s*\([^)]*\)/g, '').trim();

export default function TeachingMap({
  initialCompany,
  initialHub,
}: {
  initialCompany: string;
  initialHub: string;
}) {
  const [companyId, setCompanyId] = useState(initialCompany);
  const company = companies.find((c) => c.id === companyId) ?? companies[0];
  const [hubId, setHubId] = useState(initialHub);
  const hub = company.hubs.find((h) => h.id === hubId) ?? company.hubs[0];
  const evidence = evidenceFor(hub.id);
  const references = evidence.sources ?? companyReferences[company.id] ?? [];
  const [stages, setStages] = useState<Record<string, number>>({});
  const stage = stages[hub.id] ?? 0;
  function setStage(value: number) {
    setStages((previous) => ({ ...previous, [hub.id]: value }));
  }
  const [presenting, setPresenting] = useState(false);
  const [note, setNote] = useState('');
  const [exporting, setExporting] = useState(false);
  const [fallbackLink, setFallbackLink] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const shellRef = useRef<HTMLElement>(null);
  const [sheet, setSheet] = useState(false);
  const sheetRef = useRef<HTMLElement>(null);
  const inquiryRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    inquiryRef.current?.scrollTo({ top: 0 });
  }, [hub.id, stage]);
  useEffect(() => {
    if (!sheet) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = sheetRef.current;
    const siblings = Array.from(shellRef.current?.children ?? []).filter(
      (el) => el !== panel,
    ) as HTMLElement[];
    siblings.forEach((el) => {
      el.inert = true;
    });
    panel?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSheet(false);
      }
      if (event.key === 'Tab' && panel) {
        const items = Array.from(
          panel.querySelectorAll<HTMLElement>('button, select, a[href], input'),
        ).filter((el) => !el.hasAttribute('disabled'));
        const first = items[0],
          last = items.at(-1);
        if (
          event.shiftKey &&
          (document.activeElement === first || document.activeElement === panel)
        ) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      siblings.forEach((el) => {
        el.inert = false;
      });
      document.removeEventListener('keydown', key);
      previous?.focus();
    };
  }, [sheet]);
  const [secondId, setSecondId] = useState('');
  const second = comparisonHub(company.hubs, hub, secondId, stages)!;
  const canConnect = stage === 2 && (stages[second.id] ?? 0) >= 1;
  function select(companyValue: string, hubValue: string) {
    if (companyValue !== company.id) {
      setStages({});
      setSecondId('');
    }
    setCompanyId(companyValue);
    setHubId(hubValue);
    setNote('');
    setFallbackLink('');
  }
  function visitComparison() {
    setSecondId(hub.id);
    select(company.id, second.id);
  }
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setPresenting(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  async function fullscreen() {
    if (presenting) {
      setPresenting(false);
      if (document.fullscreenElement) await document.exitFullscreen();
      return;
    }
    setPresenting(true);
    try {
      await shellRef.current?.requestFullscreen();
    } catch {
      setNote(
        '발표용 화면으로 전환했습니다. 이 브라우저에서는 전체 화면이 제한될 수 있습니다.',
      );
    }
  }
  async function copyLink() {
    const url = new URL('/', window.location.origin);
    url.searchParams.set('company', company.id);
    url.searchParams.set('hub', hub.id);
    try {
      await navigator.clipboard.writeText(url.href);
      setNote(
        '장면 링크를 복사했습니다. PPT에 연결하면 이 거점의 질문 상태로 열립니다.',
      );
    } catch {
      setFallbackLink(url.href);
      setNote('아래 링크를 선택해 복사해 주세요.');
    }
  }
  async function saveImage(reveal: boolean) {
    if (!svgRef.current || exporting) return;
    setExporting(true);
    setNote('지도 이미지를 준비하고 있습니다.');
    let url = '';
    try {
      await document.fonts.ready;
      const svg = svgRef.current.cloneNode(true) as SVGSVGElement;
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('width', '1600');
      svg.setAttribute('height', '800');
      url = URL.createObjectURL(
        new Blob([new XMLSerializer().serializeToString(svg)], {
          type: 'image/svg+xml;charset=utf-8',
        }),
      );
      const img = new Image();
      img.src = url;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = 2400;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas');
      const font = getComputedStyle(shellRef.current!).fontFamily;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 2400, 1350);
      ctx.fillStyle = '#142c51';
      ctx.font = `bold 52px ${font}`;
      ctx.fillText(`${company.name} · 공간적 분업`, 80, 100);
      ctx.font = `30px ${font}`;
      ctx.fillText(shortName(hub.name), 80, 155);
      ctx.drawImage(img, 35, 260, 1600, 800);
      const wrap = (
        text: string,
        x: number,
        y: number,
        width: number,
        line = 45,
      ) => {
        let row = '';
        for (const c of text) {
          if (ctx.measureText(row + c).width > width) {
            ctx.fillText(row, x, y);
            y += line;
            row = c;
          } else row += c;
        }
        ctx.fillText(row, x, y);
        return y + line;
      };
      ctx.fillStyle = '#1d4ed8';
      ctx.font = `bold 34px ${font}`;
      let y = wrap(
        reveal ? `기능: ${hub.typeLabel}` : '어떤 기업 활동에 유리할까요?',
        1680,
        285,
        640,
      );
      hub.reasons.forEach((reason, i) => {
        ctx.fillStyle = '#142c51';
        ctx.font = `bold 28px ${font}`;
        y = wrap(`${i + 1}. ${reason.title}`, 1680, y + 24, 640, 38);
        if (reveal) {
          ctx.font = `25px ${font}`;
          ctx.fillStyle = '#425673';
          y = wrap(reason.detail, 1680, y + 6, 640, 35);
        }
      });
      ctx.fillStyle = '#425673';
      ctx.font = `25px ${font}`;
      ctx.fillText('Natural Earth', 80, 1220);
      ctx.fillText(
        reveal
          ? '설명용 · 지역 조건과 기업 활동의 연결을 해석한 자료입니다.'
          : '질문용 · 지역 단서 → 기능 예상 → 이유 설명',
        80,
        1270,
      );
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('PNG'))),
          'image/png',
        ),
      );
      const download = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = download;
      a.download = `${company.id}-${hub.id}-${reveal ? '설명' : '질문'}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(download), 10000);
      setNote('PPT용 2400 × 1350 PNG를 저장했습니다.');
    } catch {
      setNote('이미지를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      if (url) URL.revokeObjectURL(url);
      setExporting(false);
    }
  }
  return (
    <main
      ref={shellRef}
      className={`teach-shell ${presenting ? 'teach-presenting' : ''} ${sheet ? 'sheet-open' : ''}`}
    >
      <header className="teach-header">
        <div>
          <Globe2 />
          <strong>GLOBAL SHIFT</strong>
          <span>공간적 분업</span>
        </div>
        <nav aria-label="수업 도구">
          <details className="teach-ppt">
            <summary>
              <Download size={16} /> PPT 자료
            </summary>
            <div className="teach-ppt-panel">
              <strong>현재 거점을 PPT로</strong>
              <p>
                이미지를 넣고 장면 링크를 연결하면 같은 거점의 질문 화면이
                열립니다.
              </p>
              <Button
                variant="outline"
                disabled={exporting}
                onClick={() => saveImage(false)}
              >
                <Download />
                질문용 이미지
              </Button>
              <Button
                variant="outline"
                disabled={exporting}
                onClick={() => saveImage(true)}
              >
                <Download />
                설명용 이미지
              </Button>
              <Button variant="outline" onClick={copyLink}>
                <Link2 />
                장면 링크 복사
              </Button>
            </div>
          </details>
          <Button variant="outline" onClick={() => setSheet(true)}>
            <Printer />
            활동지
          </Button>
          <Button onClick={fullscreen}>
            {presenting ? <Minimize2 /> : <Maximize2 />}
            {presenting ? '발표 종료' : '수업 화면'}
          </Button>
        </nav>
      </header>
      <div className="teach-select">
        <label>
          기업{' '}
          <select
            value={company.id}
            onChange={(e) => select(e.target.value, '')}
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <span className="teach-scope">
          수업용 주요 거점 {company.hubs.length}곳
        </span>
        <div className="teach-hubs" aria-label="거점 선택">
          {company.hubs.map((h, i) => (
            <button
              key={h.id}
              aria-pressed={h.id === hub.id}
              onClick={() => select(company.id, h.id)}
            >
              <span>{String(i + 1).padStart(2, '0')}</span>
              {shortName(h.name)}
            </button>
          ))}
        </div>
      </div>
      <div className="teach-workspace">
        <section className="teach-map">
          <div className="teach-map-title">
            <span>{company.name}의 글로벌 거점</span>
            <h1>왜 이곳에 자리 잡았을까?</h1>
          </div>
          <svg
            ref={svgRef}
            viewBox="0 0 1000 500"
            role="img"
            aria-label={`${company.name}의 본사와 거점, 국가별 경계가 표시된 세계 지도`}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              background: '#f0f6ff',
            }}
          >
            <rect width="1000" height="500" fill="#f0f6ff" />
            {countries.map((c, i) => (
              <path
                key={i}
                d={path(c as never) ?? ''}
                fill="#d4e2f5"
                stroke="#738eaf"
                strokeWidth=".65"
              />
            ))}
            {company.hubs.map((h) => (
              <path
                key={h.id}
                d={
                  path({
                    type: 'LineString',
                    coordinates: [
                      [company.headquarters.lng, company.headquarters.lat],
                      [h.lng, h.lat],
                    ],
                  }) ?? ''
                }
                fill="none"
                stroke={h.id === hub.id ? '#2563eb' : '#9bb5d8'}
                strokeWidth={h.id === hub.id ? 2 : 1}
                strokeDasharray="5 4"
              />
            ))}
            {company.hubs.map((h, i) => {
              const [x, y] = projection([h.lng, h.lat])!;
              return (
                <g
                  key={h.id}
                  transform={`translate(${x} ${y})`}
                  role="button"
                  tabIndex={0}
                  aria-label={shortName(h.name)}
                  onClick={() => select(company.id, h.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      select(company.id, h.id);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <circle r="18" fill="transparent" />
                  <circle
                    r={h.id === hub.id ? 10 : 6}
                    fill={h.id === hub.id ? '#1d4ed8' : '#54749e'}
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x="12"
                    y="5"
                    fontFamily="sans-serif"
                    fontSize="13"
                    fontWeight="bold"
                    fill="#153361"
                    stroke="white"
                    strokeWidth="3"
                    paintOrder="stroke"
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}
            {(() => {
              const [x, y] = projection([
                company.headquarters.lng,
                company.headquarters.lat,
              ])!;
              return (
                <g transform={`translate(${x} ${y})`}>
                  <rect
                    x="-6"
                    y="-6"
                    width="12"
                    height="12"
                    fill="#102b50"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x="10"
                    y="-10"
                    fontSize="13"
                    fontFamily="sans-serif"
                    fontWeight="bold"
                    fill="#102b50"
                    stroke="white"
                    strokeWidth="3"
                    paintOrder="stroke"
                  >
                    본사
                  </text>
                </g>
              );
            })()}
            {(() => {
              const [x, y] = projection([hub.lng, hub.lat])!;
              const label = shortName(hub.name);
              const width = Math.min(350, label.length * 13 + 26);
              const left = Math.max(8, Math.min(992 - width, x - width / 2));
              const top = Math.min(465, y + 25);
              return (
                <g aria-hidden="true">
                  <rect
                    x={left}
                    y={top}
                    width={width}
                    height="32"
                    rx="6"
                    fill="white"
                    stroke="#2563eb"
                    strokeWidth="1.5"
                  />
                  <text
                    x={left + width / 2}
                    y={top + 21}
                    textAnchor="middle"
                    fontFamily="sans-serif"
                    fontSize="14"
                    fontWeight="bold"
                    fill="#153361"
                  >
                    {label}
                  </text>
                </g>
              );
            })()}
          </svg>
          <div className="teach-map-caption">
            <strong>본사 · {company.headquarters.city}</strong>
            <span>선택 거점 · {shortName(hub.name)}</span>
          </div>
          <p className="teach-source">Natural Earth</p>
          {canConnect && (
            <section
              className="teach-connection"
              aria-label="공간적 분업 연결 정리"
            >
              <div className="connection-pair">
                {[second, hub].map((h) => (
                  <div key={h.id}>
                    <span>{shortName(h.name)}</span>
                    <strong>{h.typeLabel}</strong>
                  </div>
                ))}
              </div>
              <p>{connectionQuestion}</p>
              {hub.type === second.type && (
                <small>
                  두 곳의 기능이 비슷하다면, 다른 기능을 맡은 거점도 찾아 연결해
                  보세요.
                </small>
              )}
              <details key={`${hub.id}-${second.id}`}>
                <summary>답을 나눈 뒤 · 개념 정리</summary>
                <p>{connectionConcept}</p>
              </details>
            </section>
          )}
        </section>
        <aside className="teach-inquiry">
          <div
            ref={inquiryRef}
            className="teach-inquiry-scroll"
            tabIndex={0}
            aria-label="지역 단서와 설명"
          >
            <div className="teach-region">{hub.country}</div>
            <h2>{shortName(hub.name)}</h2>
            {stage >= 1 && (
              <div className="teach-answer" aria-live="polite">
                <span>사례의 대표 기능</span>
                <strong>{hub.typeLabel}</strong>
                <small>한 거점에서 여러 기능을 함께 수행할 수 있습니다.</small>
              </div>
            )}
            {stage >= 1 && evidence.note && (
              <p className="evidence-note">{evidence.note}</p>
            )}
            <div className="teach-steps" aria-label="공개 단계">
              {steps.map((s, i) => (
                <span key={s} aria-current={i === stage ? 'step' : undefined}>
                  {i + 1} {s}
                </span>
              ))}
            </div>
            <h3>
              {stage === 0
                ? '어떤 기능에 유리할까요?'
                : stage === 1
                  ? '어떤 지역 단서가 이 기능과 연결될까요?'
                  : '지역 조건은 기업에 어떤 이점을 줄까요?'}
            </h3>
            <div className="teach-clues">
              {hub.reasons.map((r, i) => (
                <article key={r.title}>
                  <span>추론 단서 {i + 1}</span>
                  <strong>{r.title}</strong>
                  {stage === 2 && (
                    <p>
                      <em>입지 해석</em>
                      {r.detail}
                    </p>
                  )}
                </article>
              ))}
            </div>
            {stage === 2 && (
              <>
                <section className="compare-prompt">
                  <span>비교 발문</span>
                  <label>
                    함께 볼 거점
                    <select
                      value={second.id}
                      onChange={(e) => setSecondId(e.target.value)}
                    >
                      {company.hubs
                        .filter((h) => h.id !== hub.id)
                        .map((h) => (
                          <option key={h.id} value={h.id}>
                            {shortName(h.name)}
                          </option>
                        ))}
                    </select>
                  </label>
                  <strong>
                    두 지역은 어떤 조건을 갖추고, 기업 활동에서 각각 어떤 일을
                    맡을까요?
                  </strong>
                </section>
                <details className="perspective-prompt">
                  <summary>지역과 사람의 관점 · 선택 질문</summary>
                  <p>이 거점은 지역의 일자리와 산업에 어떤 변화를 만들까요?</p>
                  <p>정부·기업·노동자·주민은 어떤 점을 서로 다르게 볼까요?</p>
                </details>
                <details className="source-details">
                  <summary>교사용 · 출처와 확인 범위</summary>
                  <div className="evidence-status">
                    <strong>{evidence.status}</strong>
                    {evidence.checked && (
                      <span>기능 자료 열람 · {evidence.checked}</span>
                    )}
                  </div>
                  <p>
                    {evidence.scope ??
                      '개별 거점의 검증 정보가 등록되지 않았습니다. 아래 기업 참고자료만으로 모든 기능·수치·운영 상태가 확인된 것은 아닙니다.'}
                  </p>
                  <p>
                    입지 해석은 지역 조건을 기업의 이점과 연결한 수업용
                    설명이며, 기업이 발표한 입지 결정 사유와는 구분합니다.
                  </p>
                  <div className="source-links">
                    {references.map((source) => (
                      <a
                        key={source.url}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {source.label}
                      </a>
                    ))}
                  </div>
                </details>
              </>
            )}
          </div>
          <div className="teach-controls">
            {stage < 2 ? (
              <Button onClick={() => setStage(stage + 1)}>
                {stage === 0 ? '기능 공개' : '입지 이유 공개'}
                <ArrowRight />
              </Button>
            ) : (
              <Button onClick={visitComparison}>
                다른 거점 보기
                <ArrowRight />
              </Button>
            )}
            <Button
              variant="outline"
              disabled={stage === 0}
              onClick={() => setStage(0)}
            >
              <RotateCcw />
              다시 가리기
            </Button>
          </div>
        </aside>
      </div>
      <div className="teach-notice" role="status">
        {note}
        {fallbackLink && (
          <input
            aria-label="장면 링크 직접 복사"
            readOnly
            value={fallbackLink}
            onFocus={(e) => e.target.select()}
          />
        )}
      </div>
      <footer className="teach-footer">
        <span>지역 단서 → 기능 예상 → 이유 설명 → 분업의 연결</span>
        <a href="/?mode=student">학생 직접 탐구 · 세션 도구</a>
      </footer>
      {sheet && (
        <section
          ref={sheetRef}
          className="teach-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="인쇄용 활동지"
          tabIndex={-1}
        >
          <div className="sheet-toolbar">
            <label>
              비교할 두 번째 거점{' '}
              <select
                value={second.id}
                onChange={(e) => setSecondId(e.target.value)}
              >
                {company.hubs
                  .filter((h) => h.id !== hub.id)
                  .map((h) => (
                    <option key={h.id} value={h.id}>
                      {shortName(h.name)}
                    </option>
                  ))}
              </select>
            </label>
            <Button onClick={() => window.print()}>
              <Printer />
              인쇄 / PDF 저장
            </Button>
            <Button variant="outline" onClick={() => setSheet(false)}>
              지도로 돌아가기
            </Button>
          </div>
          <div className="sheet-paper">
            <span>공간적 분업 탐구 · {company.name}</span>
            <h1>왜 이곳에서 이 일을 할까?</h1>
            <p className="sheet-name">
              학년 / 반 __________ 번호 ______ 이름 ______________
            </p>
            <p>
              기능을 공개하기 전에 ①~②를 먼저 작성하세요. 예상과 사례가 달라도
              괜찮습니다.
            </p>
            {[hub, second].map((h, i) => (
              <article key={h.id}>
                <h2>
                  {i + 1}. {shortName(h.name)}
                </h2>
                <ul className="sheet-clues">
                  {h.reasons.map((r) => (
                    <li key={r.title}>{r.title}</li>
                  ))}
                </ul>
                <p>
                  ① 예상한 기능 (복수 선택 가능): □ 조립·생산 □ 연구개발 □ 부품
                  생산 □ 자원 채굴 □ 판매·물류 □ 기타 __________
                </p>
                <div className="sheet-lines">
                  ② 이 지역은 ____________________하므로, 기업이
                  ____________________하는 데 유리하다.
                </div>
                <div className="sheet-lines">
                  ③ 사례 확인 후 실제 기능: ____________________　더 고려할
                  단서: ____________________
                </div>
              </article>
            ))}
            <h2>두 지역의 기능을 연결해 정리해 봅시다.</h2>
            <p>{connectionQuestion} 두 지역의 기능을 근거로 설명해 보세요.</p>
            <div className="sheet-lines tall">
              기업은 ____________________에서는 ____________________을/를,
              ____________________에서는 ____________________을/를 맡기고, 이
              기능들을
            </div>
            <p className="sheet-foot">
              두 곳의 기능이 비슷하다면 다른 기능을 맡은 거점도 떠올려 보세요.
              국가의 발전 수준만으로 기능을 단정하지 않습니다.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
