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
