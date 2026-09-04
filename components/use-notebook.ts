'use client';
import { useEffect, useRef, useState } from 'react';
import { emptyComparison, type Comparison, type LearningRecord } from '@/lib/learning';

export function useNotebook(code: string, participantId: string, active: boolean) {
  const [records, setRecords] = useState<Record<string, LearningRecord>>({});
  const [comparison, setComparison] = useState<Comparison>(emptyComparison);
  const [status, setStatus] = useState('기록 준비 중');
  const [ready, setReady] = useState(false);
  const pending = useRef<Record<string, LearningRecord>>({});
  const pendingComparison = useRef<Comparison | null>(null);
  const busy = useRef(false);
  const [tick, setTick] = useState(0);
  const storageKey = `global-shift-drafts:${code || 'practice'}:${participantId}`;

  useEffect(() => {
    let cancelled = false;
    setReady(false); setRecords({}); setComparison(emptyComparison);
    pending.current = {}; pendingComparison.current = null;
    async function restore() {
      let saved: {records?: Record<string, LearningRecord>; comparison?: Comparison} = {};
      try { saved = JSON.parse(sessionStorage.getItem(storageKey) || '{}'); } catch { /* Optional crash recovery. */ }
      try {
        let work = {records: {} as Record<string, LearningRecord>, comparison: emptyComparison};
        if (code && participantId) {
          const response = await fetch(`/api/sessions/${code}?participantId=${encodeURIComponent(participantId)}`, {signal: AbortSignal.timeout(10000)});
          if (!response.ok) throw new Error('restore');
          work = (await response.json()).work ?? work;
        }
        if (cancelled) return;
        pending.current = saved.records ?? {};
        pendingComparison.current = saved.comparison ?? null;
        setRecords({...work.records, ...pending.current});
        setComparison(saved.comparison ?? work.comparison ?? emptyComparison);
        setReady(true); setStatus(code && participantId ? '수업 기록 불러옴' : '연습 모드 · 이 탭에 임시 보관');
      } catch {
        if (!cancelled) setStatus('기록을 불러오지 못했어요. 다시 불러오기를 눌러 주세요.');
      }
    }
    void restore();
    return () => { cancelled = true; };
  }, [storageKey, code, participantId]);

  function backup() {
    try { sessionStorage.setItem(storageKey, JSON.stringify({records: pending.current, comparison: pendingComparison.current})); }
    catch { setStatus('기기 임시 보관 불가 · 창을 닫지 마세요'); }
  }
  function update(record: LearningRecord) {
    setRecords(value => ({...value, [record.hubId]: record}));
    pending.current[record.hubId] = record;
    backup(); setStatus(code && participantId ? '저장 대기' : '연습 모드 · 이 탭에 임시 보관'); setTick(value => value + 1);
  }
  function updateComparison(value: Comparison) {
    setComparison(value); pendingComparison.current = value;
    backup(); setStatus(code && participantId ? '저장 대기' : '연습 모드 · 이 탭에 임시 보관'); setTick(value => value + 1);
  }
  useEffect(() => {
    if (!ready || !code || !participantId || !active) return;
    let cancelled = false;
    async function flush() {
      if (busy.current || cancelled) return;
      const entries = Object.entries(pending.current);
      const comparisonToSave = pendingComparison.current;
      if (!entries.length && !comparisonToSave) return;
      busy.current = true; setStatus('저장 중…');
      try {
        for (const [id, record] of entries) {
          const response = await fetch(`/api/sessions/${code}/activity`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...record, participantId}), signal:AbortSignal.timeout(15000)});
          if (!response.ok) throw new Error('save');
          if (pending.current[id] === record) delete pending.current[id];
        }
        if (comparisonToSave) {
          const response = await fetch(`/api/sessions/${code}/activity`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({participantId, comparison:comparisonToSave}), signal:AbortSignal.timeout(15000)});
          if (!response.ok) throw new Error('save');
          if (pendingComparison.current === comparisonToSave) pendingComparison.current = null;
        }
        backup();
        if (!cancelled) setStatus(Object.keys(pending.current).length || pendingComparison.current ? '저장 대기' : '수업 기록 저장됨');
      } catch { if (!cancelled) setStatus('아직 서버에 저장되지 않았어요 · 연결 후 자동 재시도'); }
      finally { busy.current = false; }
    }
    const timer = setTimeout(flush, 500);
    const retry = setInterval(flush, 5000);
    return () => { cancelled = true; clearTimeout(timer); clearInterval(retry); };
  }, [ready, code, participantId, active, tick]);
  return {records, comparison, update, updateComparison, status, ready};
}
