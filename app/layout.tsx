import type { Metadata } from 'next';
import { Noto_Sans_KR, Space_Grotesk } from 'next/font/google';
import './globals.css';

const noto = Noto_Sans_KR({ variable: '--font-noto', subsets: ['latin'] });
const space = Space_Grotesk({ variable: '--font-space', subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || 'global-shift-map.vercel.app'}`),
  referrer: 'no-referrer',
  title: 'GLOBAL SHIFT — 다국적 기업의 공간적 분업',
  description: '7개 다국적 기업의 글로벌 가치사슬과 입지 전략을 탐구하는 통합사회 인터랙티브 지도',
  openGraph: { title: 'GLOBAL SHIFT — 다국적 기업의 공간적 분업', description: '지도에서 글로벌 기업의 본사·R&D·생산 거점을 비교하고 입지 요인을 학습하세요.', type: 'website', images: [{ url: '/og.png', width: 1677, height: 943, alt: 'GLOBAL SHIFT — 다국적 기업의 공간적 분업' }] },
  twitter: { card: 'summary_large_image', title: 'GLOBAL SHIFT — 다국적 기업의 공간적 분업', description: '지도에서 글로벌 기업의 본사·R&D·생산 거점을 비교하고 입지 요인을 학습하세요.', images: ['/og.png'] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body className={`${noto.variable} ${space.variable}`}>{children}</body></html>; }
