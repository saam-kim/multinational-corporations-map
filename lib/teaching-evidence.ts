export type EvidenceNote = {
  status:
    | '수업용 사례'
    | '기능 자료 연결'
    | '운영 상태 재확인 필요'
    | '협력사 거점';
  checked?: string;
  scope?: string;
  sources?: { label: string; url: string }[];
  note?: string;
};

export const hubEvidence: Record<string, EvidenceNote> = {
  'samsung-vn': {
    status: '기능 자료 연결',
    checked: '2026-09-06',
    scope:
      '박닌·타이응우옌의 모바일 기기 생산 기능과 산업단지 소재를 확인했습니다. 임금 수준이나 개별 입지 결정의 원인을 검증한 자료는 아닙니다.',
    note: '두 지역을 묶어 표시했습니다. 공식 소개에는 모바일 기기 외 부품 생산도 포함됩니다.',
    sources: [
      {
        label: 'Samsung Vietnam · 사업장별 기능 (발행일 미표기)',
        url: 'https://news.samsung.com/vn/overview',
      },
    ],
  },
  'samsung-in-rd': {
    status: '기능 자료 연결',
    checked: '2026-09-06',
    scope:
      '연구개발 분야와 세계·인도 시장을 함께 다루는 역할을 확인했습니다. 임금이나 시차가 입지 결정의 원인이라는 근거는 아닙니다.',
    sources: [
      {
        label: 'Samsung Research · SRI-B 연구소 소개 (발행일 미표기)',
        url: 'https://research.samsung.com/sri-b',
      },
    ],
  },
  'samsung-in-mfg': {
    status: '기능 자료 연결',
    checked: '2026-09-06',
    scope:
      '2018년 증설 발표 당시 스마트폰 생산·내수 대응·수출 계획을 확인했습니다. 현재의 생산량이나 관세율을 뜻하지 않습니다.',
    sources: [
      {
        label: 'Samsung · 노이다 공장 증설 발표 (2018.07.09)',
        url: 'https://news.samsung.com/in/samsung-inaugurates-worlds-largest-mobile-factory-in-india',
      },
    ],
  },
  'samsung-us-foundry': {
    status: '운영 상태 재확인 필요',
    note: '오스틴과 테일러는 별도 사업장입니다. 2025년 자료는 테일러의 2026년 가동을 예정했으며, 실제 가동 여부는 별도 확인이 필요합니다.',
  },
  'apple-tw-tsmc': {
    status: '협력사 거점',
    note: '애플 소유 사업장이 아니라 주요 공급업체의 생산 거점입니다.',
  },
  'apple-cn-foxconn': {
    status: '협력사 거점',
    note: '애플 소유 사업장이 아니라 주요 공급업체의 조립 거점입니다.',
  },
  'apple-in-mfg': {
    status: '협력사 거점',
    note: '애플 소유 사업장이 아니라 여러 공급업체가 참여하는 생산 지역입니다.',
  },
  'sasol-qa-gtl': {
    status: '운영 상태 재확인 필요',
    note: '2026년 3월 발표에는 가스 공급 제한에 따른 ORYX GTL 가동 중단이 나옵니다. 이후 재가동 여부를 확인한 표시는 아닙니다.',
  },
};

export const companyReferences: Record<
  string,
  { label: string; url: string }[]
> = {
  samsung: [
    {
      label: 'Samsung Vietnam · 회사와 사업장',
      url: 'https://www.samsung.com/vn/about-us/company-info/',
    },
    {
      label: 'Samsung · 2025 미국 사업장 자료',
      url: 'https://img.us.news.samsung.com/us/wp-content/uploads/2025/09/10114602/SEC5-Samsung_SustainabilityToolkit2025_Digital_Final_9.10.2025-5.pdf',
    },
  ],
  apple: [
    {
      label: 'Apple · Supply Chain',
      url: 'https://www.apple.com/supply-chain/',
    },
  ],
  volkswagen: [
    {
      label: 'Volkswagen Group · Annual Reports',
      url: 'https://www.volkswagen-group.com/en/annual-reports-16006',
    },
  ],
  byd: [
    {
      label: 'BYD Global · Company',
      url: 'https://www.bydglobal.com/en/CompanyIntro.html',
    },
  ],
  embraer: [
    {
      label: 'Embraer · About Us',
      url: 'https://www.embraer.com/global/en/about-us',
    },
  ],
  bhp: [
    {
      label: 'BHP · Our operations',
      url: 'https://www.bhp.com/news/image-gallery/our-operations',
    },
  ],
  sasol: [
    {
      label: 'Sasol · 2025 Company overview',
      url: 'https://www.sasol.com/sites/default/files/2025-12/Sasol%20overview%20presentation%202025.pdf',
    },
    {
      label: 'Sasol · ORYX GTL 운영 상태',
      url: 'https://www.sasol.com/media-centre/media-releases/update-middle-east-developments-and-business-impacts',
    },
  ],
};

export function evidenceFor(hubId: string): EvidenceNote {
  return hubEvidence[hubId] ?? { status: '수업용 사례' };
}
