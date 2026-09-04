'use client';
import { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { companies } from '@/lib/companies';
import { expectedRole, roleNames, type LearningRecord, type Comparison } from '@/lib/learning';

export function ComparisonNotebook({open,onOpenChange,records,value,onChange,locked,status}:{open:boolean;onOpenChange:(open:boolean)=>void;records:Record<string,LearningRecord>;value:Comparison;onChange:(value:Comparison)=>void;locked:boolean;status:string}) {
  const submitted = Object.values(records).filter(r => r.evidenceOpen);
  useEffect(() => {
    if (open && !locked && submitted.length >= 2 && !value.first && !value.second) {
      onChange({...value,first:submitted[0].hubId,second:submitted[1].hubId});
    }
  }, [open, submitted, value, onChange, locked]);
  const title = (r:LearningRecord) => `${companies.find(c => c.id === r.companyId)?.name} · ${companies.find(c => c.id === r.companyId)?.hubs.find(h => h.id === r.hubId)?.name}`;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="notebook-dialog"><DialogHeader><DialogDescription>교과서 개념을 새로운 사례에 적용하기</DialogDescription><DialogTitle>두 지역, 다른 입지 이유</DialogTitle></DialogHeader>
    <p className="notebook-intro">두 곳만 살펴보고, 입지 이유의 공통점이나 차이점을 한 문장으로 남기세요.</p>
    {!submitted.length && <p>지도에서 한 곳의 가설과 이유를 남기고 사례를 확인하면 이곳에 기록이 쌓입니다. 두 곳을 비교해 보세요.</p>}
    <div className="notebook-records">{submitted.filter(r => r.hubId === value.first || r.hubId === value.second || submitted.length < 2).map(r => <article key={r.hubId}><strong>{title(r)}</strong><span>사례의 기능 · {roleNames[expectedRole(companies.find(c => c.id === r.companyId)?.hubs.find(h => h.id === r.hubId)?.type ?? '')]}</span><span>내가 예상한 기능 · {roleNames[r.roleGuess ?? '']}</span><p>{r.inference}</p>{r.revision && <><span>보완한 설명</span><p>{r.revision}</p></>}</article>)}</div>
    <fieldset disabled={locked || submitted.length < 2}><legend>비교 한 문장</legend><details><summary>비교할 거점 바꾸기</summary><div className="comparison-selects">{(['first','second'] as const).map((key,index) => <label key={key}>{index+1}번 거점<select value={value[key]} onChange={e => onChange({...value,[key]:e.target.value})}><option value="">거점 선택</option>{submitted.filter(r => r.hubId !== value[key === 'first' ? 'second' : 'first']).map(r => <option key={r.hubId} value={r.hubId}>{title(r)}</option>)}</select></label>)}</div></details>
      <label htmlFor="comparison-explanation">두 지역의 기능과 입지 이유에는 어떤 공통점·차이점이 있나요?</label><textarea id="comparison-explanation" value={value.explanation} maxLength={1000} onChange={e => onChange({...value,explanation:e.target.value})} placeholder="A는 ___ 때문에, B는 ___ 때문에 이 기능이 입지한다. 공통점은 ___, 차이점은 ___이다." />
    </fieldset><p className="save-status" role="status">{status}</p>
    <details className="lesson-guide"><summary>더 생각해 볼까요? · 선택</summary><p>미국 텍사스의 생산 거점을 살펴보세요. 임금이 낮은 곳이 아닌데도 생산 공장이 입지하는 이유를 친구와 이야기해 보세요.</p><p>인도 벵갈루루는 연구개발 사례입니다. 연구개발을 선진국에서만 한다고 말할 수 있을까요?</p></details>
  </DialogContent></Dialog>;
}
