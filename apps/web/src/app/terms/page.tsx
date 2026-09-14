import type { Metadata } from 'next'; import { Header } from '@/components/Header'; import { Footer } from '@/components/Footer'; import { loadSettings } from '@/lib/data';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '服務條款', alternates: { canonical: '/terms' } };
export default async function Terms(){const siteSettings=await loadSettings();return <><Header siteSettings={siteSettings}/><main id="main-content" className="policy-page container"><span className="eyebrow">TERMS</span><h1>服務條款</h1><p className="policy-content">{siteSettings.termsText}</p></main><Footer siteSettings={siteSettings}/></>}
