import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { loadSettings } from '@/lib/data';
import { fixtureSettings } from '@tian-xin-ge/contracts';

export const dynamic = 'force-dynamic';

export default async function NotFound(){
  const siteSettings = await loadSettings().catch(() => fixtureSettings);
  return <><Header siteSettings={siteSettings}/><main id="main-content" tabIndex={-1} className="not-found"><span className="eyebrow">404</span><h1>找不到這個頁面</h1><p>頁面可能已經移動，回到首頁重新開始吧。</p><Link className="btn" href="/">回到首頁　→</Link></main><Footer siteSettings={siteSettings}/></>;
}
