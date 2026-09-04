export type LearningRecord = {
  companyId: string; hubId: string; roleGuess: string | null;
  inference: string; clueIndex: number; evidenceOpen: boolean;
  revision: string; helpRequested: boolean;
};
export type Comparison = { first: string; second: string; explanation: string; transfer: string };
export const emptyComparison: Comparison = {first: '', second: '', explanation: '', transfer: ''};
export function emptyRecord(companyId: string, hubId: string): LearningRecord {
  return {companyId, hubId, roleGuess: null, inference: '', clueIndex: -1, evidenceOpen: false, revision: '', helpRequested: false};
}
export function expectedRole(type: string) {
  return type === 'assembly' ? 'assembly' : type === 'rd' ? 'rd' : type === 'fab' ? 'component' : type === 'mine' ? 'resource' : 'market';
}
export const roleNames: Record<string, string> = {assembly:'조립·생산',rd:'연구개발',component:'부품 생산',resource:'자원 채굴',market:'판매·물류'};
export function canCompare(record: LearningRecord) {
  return Boolean(record.roleGuess && record.clueIndex >= 0 && record.inference.trim().length >= 8);
}
