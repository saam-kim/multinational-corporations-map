export type EvidenceNote = {
  status: '주요 거점' | '건설·가동 준비' | '일시 가동 중단' | '협력사 거점';
  checked: string;
  note?: string;
};

export const hubEvidence: Record<string, EvidenceNote> = {
  'samsung-us-foundry': {
    status: '건설·가동 준비', checked: '2026.09',
    note: '오스틴 공장은 운영 중이며, 테일러 신규 공장은 2026년 가동 개시 예정으로 발표되었습니다.',
  },
  'apple-tw-tsmc': { status: '협력사 거점', checked: '2026.09', note: '애플 소유 사업장이 아니라 주요 공급업체의 생산 거점입니다.' },
  'apple-cn-foxconn': { status: '협력사 거점', checked: '2026.09', note: '애플 소유 사업장이 아니라 주요 공급업체의 조립 거점입니다.' },
  'apple-in-mfg': { status: '협력사 거점', checked: '2026.09', note: '애플 소유 사업장이 아니라 여러 공급업체가 참여하는 생산 지역입니다.' },
  'sasol-qa-gtl': { status: '일시 가동 중단', checked: '2026.09', note: 'Sasol은 2026년 3월 가스 공급 제한으로 ORYX GTL 가동을 중단했다고 밝혔습니다.' },
};

export const companyReferences: Record<string, { label: string; url: string }[]> = {
  samsung: [
    { label: 'Samsung Vietnam · 회사와 사업장', url: 'https://www.samsung.com/vn/about-us/company-info/' },
    { label: 'Samsung · 2025 미국 사업장 자료', url: 'https://img.us.news.samsung.com/us/wp-content/uploads/2025/09/10114602/SEC5-Samsung_SustainabilityToolkit2025_Digital_Final_9.10.2025-5.pdf' },
  ],
  apple: [{ label: 'Apple · Supply Chain', url: 'https://www.apple.com/supply-chain/' }],
  volkswagen: [{ label: 'Volkswagen Group · Annual Reports', url: 'https://www.volkswagen-group.com/en/annual-reports-16006' }],
  byd: [{ label: 'BYD Global · Company', url: 'https://www.bydglobal.com/en/CompanyIntro.html' }],
  embraer: [{ label: 'Embraer · About Us', url: 'https://www.embraer.com/global/en/about-us' }],
  bhp: [{ label: 'BHP · Our operations', url: 'https://www.bhp.com/news/image-gallery/our-operations' }],
  sasol: [
    { label: 'Sasol · 2025 Company overview', url: 'https://www.sasol.com/sites/default/files/2025-12/Sasol%20overview%20presentation%202025.pdf' },
    { label: 'Sasol · ORYX GTL 운영 상태', url: 'https://www.sasol.com/media-centre/media-releases/update-middle-east-developments-and-business-impacts' },
  ],
};

export function evidenceFor(hubId: string): EvidenceNote {
  return hubEvidence[hubId] ?? { status: '주요 거점', checked: '2026.09' };
}
