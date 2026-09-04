'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Link2, Maximize2, Minimize2, Printer, ArrowRight, RotateCcw, Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { companies } from '@/lib/companies';
import worldAtlas from 'world-atlas/countries-50m.json';
import { geoEquirectangular, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import './teaching-map.css';

const projection = geoEquirectangular().scale(159.154943).translate([500, 250]);
const path = geoPath(projection);
const countries = (feature(worldAtlas as never, worldAtlas.objects.countries as never) as unknown as {features: {id?: string | number}[]}).features;
const steps = ['지역 단서', '기능 공개', '이유 공개'];

export default function TeachingMap({initialCompany, initialHub}: {initialCompany: string; initialHub: string}) {
  const [companyId, setCompanyId] = useState(initialCompany);
  const company = companies.find(c => c.id === companyId) ?? companies[0];
  const [hubId, setHubId] = useState(initialHub);
  const hub = company.hubs.find(h => h.id === hubId) ?? company.hubs[0];
  const [stage, setStage] = useState(0);
  const [presenting, setPresenting] = useState(false);
  const [note, setNote] = useState('');
  const [exporting, setExporting] = useState(false);
  const [fallbackLink, setFallbackLink] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const shellRef = useRef<HTMLElement>(null);
  const [sheet, setSheet] = useState(false);
  const [secondId, setSecondId] = useState('');
  const second = company.hubs.find(h => h.id === secondId && h.id !== hub.id) ?? company.hubs.find(h => h.id !== hub.id)!;
  function select(companyValue: string, hubValue: string) { setCompanyId(companyValue); setHubId(hubValue); setStage(0); setNote(''); setFallbackLink(''); }
  useEffect(() => { const onChange = () => { if (!document.fullscreenElement) setPresenting(false); }; document.addEventListener('fullscreenchange', onChange); return () => document.removeEventListener('fullscreenchange', onChange); }, []);
  async function fullscreen() {
    if (presenting) {setPresenting(false); if (document.fullscreenElement) await document.exitFullscreen(); return;}
    setPresenting(true);
    try {await shellRef.current?.requestFullscreen();} catch {setNote('발표용 화면으로 전환했습니다. 이 브라우저에서는 전체 화면이 제한될 수 있습니다.');}
  }
  async function copyLink() {
    const url = new URL('/', window.location.origin); url.searchParams.set('company', company.id); url.searchParams.set('hub', hub.id);
    try { await navigator.clipboard.writeText(url.href); setNote('장면 링크를 복사했습니다. PPT에 연결하면 이 거점의 질문 상태로 열립니다.'); }
    catch {setFallbackLink(url.href); setNote('아래 링크를 선택해 복사해 주세요.');}
  }
  async function saveImage(reveal: boolean) {
    if (!svgRef.current || exporting) return;
    setExporting(true); setNote('지도 이미지를 준비하고 있습니다.');
    let url = '';
    try {
      await document.fonts.ready;
      const svg = svgRef.current.cloneNode(true) as SVGSVGElement;
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); svg.setAttribute('width', '1600'); svg.setAttribute('height', '800');
      url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], {type:'image/svg+xml;charset=utf-8'}));
      const img = new Image(); img.src = url; await img.decode();
      const canvas = document.createElement('canvas'); canvas.width = 2400; canvas.height = 1350;
      const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('canvas');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,2400,1350);
      ctx.fillStyle = '#142c51'; ctx.font = 'bold 52px sans-serif'; ctx.fillText(`${company.name} · 공간적 분업`,80,100);
      ctx.font = '30px sans-serif'; ctx.fillText(hub.name,80,155);
      ctx.drawImage(img,35,260,1600,800);
      const wrap = (text: string, x: number, y: number, width: number, line = 45) => {let row=''; for (const c of text) {if(ctx.measureText(row+c).width>width){ctx.fillText(row,x,y); y+=line;row=c;} else row+=c;} ctx.fillText(row,x,y);return y+line;};
      ctx.fillStyle = '#1d4ed8'; ctx.font = 'bold 34px sans-serif';
      let y = wrap(reveal ? `기능: ${hub.typeLabel}` : '어떤 기업 활동에 유리할까요?',1680,285,640);
      hub.reasons.forEach((reason,i) => {ctx.fillStyle='#142c51'; ctx.font='bold 28px sans-serif'; y=wrap(`${i+1}. ${reason.title}`,1680,y+24,640,38); if(reveal){ctx.font='25px sans-serif'; ctx.fillStyle='#425673'; y=wrap(reason.detail,1680,y+6,640,35);}});
      ctx.fillStyle='#425673';ctx.font='25px sans-serif';ctx.fillText('Natural Earth · 연결선은 본사와 거점의 관계이며 실제 운송 경로가 아닙니다.',80,1220);
      ctx.fillText(reveal ? '설명용 · 지역 조건과 기업 활동의 이점을 연결해 설명해 봅시다.' : '질문용 · 지역 단서 → 기능 예상 → 이유 설명',80,1270);
      const blob = await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG')),'image/png'));
      const download = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=download; a.download=`${company.id}-${hub.id}-${reveal?'설명':'질문'}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(download),10000);
      setNote('PPT용 2400 × 1350 PNG를 저장했습니다.');
    } catch {setNote('이미지를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');} finally {if(url)URL.revokeObjectURL(url);setExporting(false);}
  }
  return <main ref={shellRef} className={`teach-shell ${presenting?'teach-presenting':''} ${sheet?'sheet-open':''}`}>
    <header className="teach-header"><div><Globe2/><strong>GLOBAL SHIFT</strong><span>공간적 분업</span></div><nav aria-label="수업 도구"><Button variant="outline" onClick={copyLink}><Link2/>장면 링크</Button><Button variant="outline" onClick={()=>setSheet(true)}><Printer/>활동지</Button><Button onClick={fullscreen}>{presenting?<Minimize2/>:<Maximize2/>}{presenting?'발표 종료':'수업 화면'}</Button></nav></header>
    <div className="teach-select"><label>기업 <select value={company.id} onChange={e=>select(e.target.value,'')}>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><div className="teach-hubs" aria-label="거점 선택">{company.hubs.map((h,i)=><button key={h.id} aria-pressed={h.id===hub.id} onClick={()=>select(company.id,h.id)}><span>{String(i+1).padStart(2,'0')}</span>{h.name}</button>)}</div></div>
    <div className="teach-workspace"><section className="teach-map"><div className="teach-map-title"><span>{company.name}의 글로벌 거점</span><h1>왜 이곳에 자리 잡았을까?</h1><p>본사와 거점의 위치를 살펴보고, 지역 단서로 기능을 예상해 보세요.</p></div>
      <svg ref={svgRef} viewBox="0 0 1000 500" role="img" aria-label={`${company.name}의 본사와 거점, 국가별 경계가 표시된 세계 지도`} style={{width:'100%',height:'auto',display:'block',background:'#f0f6ff'}}>
        <rect width="1000" height="500" fill="#f0f6ff"/>
        {countries.map((c,i)=><path key={i} d={path(c as never)??''} fill="#d4e2f5" stroke="#849cbd" strokeWidth=".55"/>)}
        {company.hubs.map(h=><path key={h.id} d={path({type:'LineString',coordinates:[[company.headquarters.lng,company.headquarters.lat],[h.lng,h.lat]]})??''} fill="none" stroke={h.id===hub.id?'#2563eb':'#9bb5d8'} strokeWidth={h.id===hub.id?2:1} strokeDasharray="5 4"/>)}
        {company.hubs.map((h,i)=>{const [x,y]=projection([h.lng,h.lat])!;return <g key={h.id} transform={`translate(${x} ${y})`} role="button" tabIndex={0} aria-label={h.name} onClick={()=>select(company.id,h.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(company.id,h.id);}}} style={{cursor:'pointer'}}><circle r="18" fill="transparent"/><circle r={h.id===hub.id?10:6} fill={h.id===hub.id?'#1d4ed8':'#54749e'} stroke="white" strokeWidth="2"/><text x="12" y="5" fontFamily="sans-serif" fontSize="13" fontWeight="bold" fill="#153361" stroke="white" strokeWidth="3" paintOrder="stroke">{i+1}</text></g>;})}
        {(()=>{const [x,y]=projection([company.headquarters.lng,company.headquarters.lat])!;return <g transform={`translate(${x} ${y})`}><rect x="-6" y="-6" width="12" height="12" fill="#102b50" stroke="white" strokeWidth="2"/><text x="10" y="-10" fontSize="13" fontFamily="sans-serif" fontWeight="bold" fill="#102b50" stroke="white" strokeWidth="3" paintOrder="stroke">본사</text></g>;})()}
      </svg><div className="teach-map-caption"><strong>본사 · {company.headquarters.city}</strong><span>선택 거점 · {hub.name}</span></div><p className="teach-source">Natural Earth · 연결선은 본사와 거점의 관계이며 실제 운송 경로가 아닙니다.</p>
      <details className="teach-export"><summary>PPT에 지도 넣기</summary><p>질문용 이미지를 PPT에 넣고, 이미지에 ‘장면 링크’를 연결하세요.</p><div><Button variant="outline" disabled={exporting} onClick={()=>saveImage(false)}><Download/>질문용 PNG</Button><Button variant="outline" disabled={exporting} onClick={()=>saveImage(true)}><Download/>설명용 PNG</Button></div></details>
    </section><aside className="teach-inquiry"><div className="teach-region">{hub.country}</div><h2>{hub.name}</h2><div className="teach-steps" aria-label="공개 단계">{steps.map((s,i)=><span key={s} aria-current={i===stage?'step':undefined}>{i+1} {s}</span>)}</div><h3>{stage===0?'어떤 기능에 유리할까요?':stage===1?'어떤 지역 단서가 이 기능과 연결될까요?':'지역 조건은 기업에 어떤 이점을 줄까요?'}</h3><div className="teach-clues">{hub.reasons.map((r,i)=><article key={r.title}><span>단서 {i+1}</span><strong>{r.title}</strong>{stage===2&&<p>{r.detail}</p>}</article>)}</div>{stage>=1&&<div className="teach-answer" aria-live="polite"><span>이 거점의 기능</span><strong>{hub.typeLabel}</strong></div>}<div className="teach-controls">{stage<2?<Button onClick={()=>setStage(stage+1)}>{stage===0?'기능 공개':'입지 이유 공개'}<ArrowRight/></Button>:<p>다른 거점과 입지 이유를 비교해 보세요.</p>}<Button variant="outline" disabled={stage===0} onClick={()=>setStage(0)}><RotateCcw/>다시 가리기</Button></div></aside></div>
    <div className="teach-notice" role="status">{note}{fallbackLink&&<input aria-label="장면 링크 직접 복사" readOnly value={fallbackLink} onFocus={e=>e.target.select()}/>}</div>
    <footer className="teach-footer"><span>단서 살펴보기 → 기능 예상하기 → 이유 설명하기 → 사례와 비교하기</span><a href="/?mode=student">학생 직접 탐구 · 세션 도구</a></footer>
    {sheet&&<section className="teach-sheet"><div className="sheet-toolbar"><label>비교할 두 번째 거점 <select value={second.id} onChange={e=>setSecondId(e.target.value)}>{company.hubs.filter(h=>h.id!==hub.id).map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></label><Button onClick={()=>window.print()}><Printer/>인쇄 / PDF 저장</Button><Button variant="outline" onClick={()=>setSheet(false)}>지도로 돌아가기</Button></div><div className="sheet-paper"><span>공간적 분업 탐구 · {company.name}</span><h1>왜 이곳에서 이 일을 할까?</h1><p className="sheet-name">학년 / 반 __________ 번호 ______ 이름 ______________</p><p>기능을 공개하기 전에 ①~②를 먼저 작성하세요. 예상과 사례가 달라도 괜찮습니다.</p>{[hub,second].map((h,i)=><article key={h.id}><h2>{i+1}. {h.name}</h2><p>지역 단서: {h.reasons.map(r=>r.title).join(' / ')}</p><p>① 예상한 기능: □ 조립·생산 □ 연구개발 □ 부품 생산 □ 자원 채굴 □ 판매·물류</p><div className="sheet-lines">② 이 지역은 ____________________하므로, 기업이 ____________________하는 데 유리하다.</div><div className="sheet-lines">③ 사례 확인 후 실제 기능: ____________________　더 고려할 단서: ____________________</div></article>)}<h2>두 지역을 비교해 한 문장으로 정리해 봅시다.</h2><div className="sheet-lines tall">두 지역은 ____________________라는 점에서 같거나 다르다. 그 이유는</div><p className="sheet-foot">국가의 발전 수준만으로 기업 기능을 단정하지 말고, 지역 조건과 기업 활동의 이점을 연결해 보세요.</p></div></section>}
  </main>;
}
