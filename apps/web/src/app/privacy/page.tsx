import type { Metadata } from 'next'; import { Header } from '@/components/Header'; import { Footer } from '@/components/Footer'; import { loadSettings } from '@/lib/data';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '隱私權政策', alternates: { canonical: '/privacy' } };
export default async function Privacy(){const siteSettings=await loadSettings();return <><Header siteSettings={siteSettings}/><main id="main-content" className="policy-page container"><span className="eyebrow">POLICY</span><h1>隱私權政策</h1><p className="policy-content">{siteSettings.privacyText}</p></main><Footer siteSettings={siteSettings}/></>}
