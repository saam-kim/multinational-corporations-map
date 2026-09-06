import assert from 'node:assert/strict';
import { test } from 'node:test';
import { companies } from '../lib/companies.ts';
import {
  clueFactor,
  comparisonHub,
  connectionConcept,
  connectionQuestion,
  splitExplanation,
} from '../lib/teaching-flow.ts';
import { evidenceFor, hubEvidence } from '../lib/teaching-evidence.ts';

const samsung = companies.find((c) => c.id === 'samsung');
const vietnam = samsung.hubs.find((h) => h.id === 'samsung-vn');
const indiaResearch = samsung.hubs.find((h) => h.id === 'samsung-in-rd');

test('the first Samsung comparison connects production and R&D', () => {
  assert.equal(comparisonHub(samsung.hubs, vietnam).id, indiaResearch.id);
});

test('each company prefers a different function when one exists', () => {
  for (const company of companies) {
    for (const hub of company.hubs) {
      const second = comparisonHub(company.hubs, hub);
      assert.notEqual(second.id, hub.id);
      assert(company.hubs.includes(second));
      if (company.hubs.some((h) => h.type !== hub.type))
        assert.notEqual(second.type, hub.type);
    }
  }
});

test('a teacher can explicitly compare the same function', () => {
  assert.equal(
    comparisonHub(samsung.hubs, vietnam, 'samsung-in-mfg').id,
    'samsung-in-mfg',
  );
});

test('return comparison retains an already revealed partner', () => {
  assert.equal(
    comparisonHub(samsung.hubs, indiaResearch, '', { [vietnam.id]: 2 }).id,
    vietnam.id,
  );
});

test('invalid or current preferences cannot compare a hub with itself', () => {
  for (const preferred of ['missing', vietnam.id, 'apple-tw-tsmc']) {
    assert.equal(
      comparisonHub(samsung.hubs, vietnam, preferred).id,
      indiaResearch.id,
    );
  }
  assert.equal(comparisonHub([vietnam], vietnam), undefined);
});

test('unregistered evidence never receives an automatic verification date', () => {
  assert.equal(evidenceFor('unregistered').checked, undefined);
  assert.equal(evidenceFor('samsung-us-rd').checked, undefined);
  for (const evidence of Object.values(hubEvidence)) {
    if (evidence.checked) {
      assert(evidence.scope);
      assert(evidence.sources?.length);
      assert.match(evidence.checked, /^\d{4}-\d{2}-\d{2}$/);
    }
  }
});

test('past construction or shutdown announcements are not current-status certifications', () => {
  for (const id of ['samsung-us-foundry', 'sasol-qa-gtl']) {
    assert.equal(evidenceFor(id).checked, undefined);
    assert.match(evidenceFor(id).status, /재확인/);
  }
});

test('lesson clues omit unsupported wage ratios and continuous-development claims', () => {
  const text = samsung.hubs.map((h) => JSON.stringify(h.reasons)).join(' ');
  assert.doesNotMatch(text, /1\/3|1\/4|24시간|가성비|엔지니어 풀|20%/);
  assert.match(connectionQuestion, /공간적 분업/);
  assert.match(connectionConcept, /나누어 배치하고 연결/);
});

test('clue titles avoid unexplained specialist terms in the question stage', () => {
  const titles = companies
    .flatMap((company) =>
      company.hubs.flatMap((hub) => hub.reasons.map((reason) => reason.title)),
    )
    .join(' ');
  assert.doesNotMatch(
    titles,
    /수직계열화|인센티브|클러스터|리스크|미세 나노|SDV|MERCOSUR|GTL/,
  );
  assert.doesNotMatch(titles, /(있음|많음|쉬움|커짐|줄임)$/);
});

test('every clue receives a short location-factor label', () => {
  const allowed = new Set([
    '위험 분산', '시장', '정책·제도', '교통·접근', '자원',
    '인력·지식', '산업 집적', '기술', '생산 조건', '지역 조건',
  ]);
  for (const company of companies) {
    for (const hub of company.hubs) {
      for (const reason of hub.reasons) {
        const factor = clueFactor(reason.title);
        assert(allowed.has(factor));
        assert(factor.length <= 6);
      }
    }
  }
});

test('Vietnam clues include concise causal background without overstating skills', () => {
  assert.doesNotMatch(vietnam.reasons[0].title, /^숙련된/);
  for (const reason of vietnam.reasons) {
    assert.equal(typeof reason.background, 'string');
    assert(reason.background.length >= 70);
    assert(reason.background.length <= 180);
  }
  assert.match(vietnam.reasons[0].background, /투자|생산 현장/);
  assert.match(vietnam.reasons[0].background, /부족|과제/);
});

test('long explanations can show a core sentence before optional detail', () => {
  assert.deepEqual(splitExplanation('핵심입니다. 보충 내용입니다.'), [
    '핵심입니다.',
    '보충 내용입니다.',
  ]);
  assert.deepEqual(splitExplanation('한 문장 설명'), ['한 문장 설명', '']);
});

const base = process.env.TEACHING_TEST_BASE_URL;
test(
  'all public scene links render question-first without revealed answers',
  { skip: !base },
  async () => {
    for (const company of companies) {
      await Promise.all(
        company.hubs.map(async (hub) => {
          const url = new URL('/', base);
          url.searchParams.set('company', company.id);
          url.searchParams.set('hub', hub.id);
          const response = await fetch(url, {
            signal: AbortSignal.timeout(30000),
          });
          assert.equal(response.status, 200, hub.id);
          // Exclude serialized React payload: it contains data, not visible lesson content.
          const html = (await response.text()).replace(
            /<script\b[^>]*>[\s\S]*?<\/script>/g,
            '',
          );
          assert.match(html, /어떤 기능에 유리할까요/);
          assert.doesNotMatch(
            html,
            /사례의 대표 기능|공간적 분업 연결 정리|자료 확인 2026/,
          );
          assert.doesNotMatch(html, /TSMC 파운드리|SRIB-B/);
        }),
      );
    }
  },
);
