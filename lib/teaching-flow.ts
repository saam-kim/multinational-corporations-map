type HubChoice = { id: string; type: string };

// Prefer a different function; two assembly sites alone do not show functional division.
export function comparisonHub<T extends HubChoice>(
  hubs: T[],
  current: T,
  preferred = '',
  stages: Record<string, number> = {},
): T | undefined {
  const others = hubs.filter((h) => h.id !== current.id);
  return (
    others.find((h) => h.id === preferred) ??
    others.find((h) => h.type !== current.type && (stages[h.id] ?? 0) >= 1) ??
    others.find((h) => (stages[h.id] ?? 0) >= 1) ??
    (current.id === 'samsung-vn'
      ? others.find((h) => h.id === 'samsung-in-rd')
      : undefined) ??
    others.find((h) => h.type !== current.type) ??
    others[0]
  );
}

export const connectionQuestion =
  '이 사례가 단순한 해외 진출을 넘어 공간적 분업에 해당하는 이유는 무엇일까요?';
export const connectionConcept =
  '공간적 분업은 기업 활동의 여러 기능을 지역별로 나누어 배치하고 연결하는 것입니다. 지역의 조건을 활용하되, 한 지역이 여러 기능을 맡을 수도 있습니다.';

export function splitExplanation(detail: string): [string, string] {
  const end = detail.indexOf('다.');
  return end > -1 && end + 2 < detail.length
    ? [detail.slice(0, end + 2), detail.slice(end + 2).trim()]
    : [detail, ''];
}

export function clueFactor(title: string): string {
  if (/위험/.test(title)) return '위험 분산';
  if (/시장|소비|고객사|수요/.test(title)) return '시장';
  if (/정부|정책|협정|합작|역내 무역/.test(title)) return '정책·제도';
  if (/항만|항구|공항|교통|접근성|해협|해상/.test(title)) return '교통·접근';
  if (/원료|자원|철광석|구리 광상|천연가스|석탄|에탄|리튬|인산철/.test(title)) return '자원';
  if (/인력|대학|연구소|언어·역사/.test(title)) return '인력·지식';
  if (/산업단지|기업.*집적|협력업체|산업 집적|시설|공급망/.test(title)) return '산업 집적';
  if (/기술|공정|소프트웨어/.test(title)) return '기술';
  if (/생산비|생산 경험/.test(title)) return '생산 조건';
  return '지역 조건';
}
