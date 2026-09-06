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
      '박닌·타이응우옌의 모바일 기기 생산 기능과 산업단지 소재, 베트남 전자 산업의 외국인 투자·고용 확대와 북부 산업단지의 교통축 집적을 확인했습니다.',
    note: '두 지역을 묶어 표시했습니다. 형성 배경은 여러 자료를 종합한 설명이며, 한 기업의 입지 결정이 하나의 원인만으로 이루어졌다는 뜻은 아닙니다.',
    sources: [
      {
        label: 'Samsung Vietnam · 사업장별 기능 (발행일 미표기)',
        url: 'https://news.samsung.com/vn/overview',
      },
      {
        label: 'ILO · 베트남 전자 공급망과 고용 보고서 (2023)',
        url: 'https://www.ilo.org/sites/default/files/wcmsp5/groups/public/%40ed_dialogue/%40sector/documents/publication/wcms_865520.pdf',
      },
      {
        label: 'World Bank · 세계개발보고서: 베트남 전자 산업 사례 (2020)',
        url: 'https://documents1.worldbank.org/curated/en/310211570690546749/pdf/World-Development-Report-2020-Trading-for-Development-in-the-Age-of-Global-Value-Chains.pdf',
      },
      {
        label: 'World Bank · 베트남 성장과 연결성 보고서 (2019)',
        url: 'https://documents1.worldbank.org/curated/en/590451578409008253/pdf/Vietnam-Development-Report-2019-Connecting-Vietnam-for-Growth-and-Shared-Prosperity.pdf',
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
      {
        label: '인도 전자정보기술부 · 대규모 전자제품 생산연계 지원',
        url: 'https://www.meity.gov.in/offerings/schemes-and-services/details/production-linked-incentive-scheme-pli-for-large-scale-electronics-manufacturing-gNyMDOtQWa',
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
  'byd-hu-mfg': {
    status: '운영 상태 재확인 필요',
    checked: '2026-09-06',
    scope:
      '세게드 공장의 건설과 시험 단계는 확인되지만 전체 시설의 양산 시점은 계속 조정될 수 있습니다.',
    note: '완전 가동된 공장으로 단정하지 않고 구축·시험 단계의 생산 거점으로 표시했습니다.',
    sources: [
      {
        label: 'BYD · 세게드 승용차 공장 발표 (2023.12.22)',
        url: 'https://www.byd.com/eu/news-list/BYD_to_Build_A_New_Energy_Passenger_Vehicle_Factory_in_Hungary_for_Localised_Production_in_Europe.html',
      },
      {
        label: 'Csongrád-Csanád 정부청 · 공장 환경허가 자료 (2026)',
        url: 'https://kormanyhivatalok.hu/medianezet/72444',
      },
    ],
  },
  'emb-pt-mfg': {
    status: '협력사 거점',
    checked: '2026-09-06',
    scope:
      '에보라 두 공장은 2022년 Aernnova가 인수했으며 이후에도 엠브라에르 항공기용 구조 부품을 생산합니다.',
    note: '현재는 엠브라에르 소유 공장이 아니라 장기 공급관계에 있는 협력사 거점입니다.',
    sources: [
      {
        label: 'Aernnova · 에보라 공장 인수 완료 (2022.05.03)',
        url: 'https://www.aernnova.com/news/aernnova-concluye-el-acuerdo-de-adquisicion-de-las-dos-fabricas-de-embraer-en-evora',
      },
      {
        label: 'Embraer · 2024 연차보고서',
        url: 'https://embraer.com/media/tkcnfswb/annual_report_2024_eng.pdf',
      },
    ],
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
    {
      label: 'Samsung · 테일러 반도체 공장 입지 발표',
      url: 'https://news.samsung.com/us/samsung-new-advanced-semiconductor-fab-site-taylor-texas/',
    },
    {
      label: 'Samsung Research · 미국 연구소 소개',
      url: 'https://research.samsung.com/sra',
    },
  ],
  apple: [
    {
      label: 'Apple · Supply Chain',
      url: 'https://www.apple.com/supply-chain/',
    },
    {
      label: '대만 투자청 · 반도체 산업 집적 자료',
      url: 'https://investtaiwan.nat.gov.tw/getFile?Fun=ArticleAction&file=a78f26d2-dbe0-4fb3-9ece-093f18f60ee3.pdf&lang=eng',
    },
    {
      label: '인도 전자정보기술부 · 대규모 전자제품 생산연계 지원',
      url: 'https://www.meity.gov.in/offerings/schemes-and-services/details/production-linked-incentive-scheme-pli-for-large-scale-electronics-manufacturing-gNyMDOtQWa',
    },
  ],
  volkswagen: [
    {
      label: 'Volkswagen · 멕시코 푸에블라 생산거점',
      url: 'https://www.volkswagen-newsroom.com/en/volkswagen-de-mexico-4070',
    },
    {
      label: 'Volkswagen · 중국 합작의 역사',
      url: 'https://www.volkswagen-group.com/en/volkswagen-chronicle-17351/1982-to-1991-new-brands-new-markets-17359',
    },
  ],
  byd: [
    {
      label: 'BYD · 태국 라용 공장 가동 발표',
      url: 'https://www.bydglobal.com/sites/Satellite?c=BydArticle&cid=1617162479288&d=Touch&pagename=BYD_EN%2FBydArticle%2FBYD_ENCommon%2FArticleDetails',
    },
    {
      label: 'BYD · 헝가리 현지 생산 계획',
      url: 'https://www.byd.com/eu/news-list/BYD_to_Build_A_New_Energy_Passenger_Vehicle_Factory_in_Hungary_for_Localised_Production_in_Europe.html',
    },
  ],
  embraer: [
    {
      label: 'Embraer · 미국 내 생산·서비스 거점',
      url: 'https://www.embraer.com/america-flies-on-our-wings/en/',
    },
    {
      label: 'Aerospace Valley · 툴루즈 항공우주 집적',
      url: 'https://www.aerospace-valley.com/en',
    },
  ],
  bhp: [
    {
      label: 'BHP · Our operations',
      url: 'https://www.bhp.com/news/image-gallery/our-operations',
    },
    {
      label: 'USGS · 안데스 반암형 구리 광상',
      url: 'https://www.usgs.gov/data/porphyry-copper-deposits-and-prospects-andes-mountains-south-america',
    },
    {
      label: 'Enterprise Singapore · 국제 원자재 거래 생태계',
      url: 'https://www.enterprisesg.gov.sg/grow-your-business/partner-with-singapore/trade/overview',
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
    {
      label: 'Sasol · 기술과 해외 거점의 형성 과정',
      url: 'https://www.sasol.com/historical-milestones',
    },
  ],
};

export function evidenceFor(hubId: string): EvidenceNote {
  return hubEvidence[hubId] ?? { status: '수업용 사례' };
}
