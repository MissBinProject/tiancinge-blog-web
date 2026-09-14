import type { Metadata } from 'next';
import './globals.css';
import { loadSettings } from '@/lib/data';

export async function generateMetadata(): Promise<Metadata> {
  const site = await loadSettings();
  const base = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  return { title: site.seoTitle || `${site.brandName}｜${site.tagline}`, description: site.seoDescription || site.heroDescription, metadataBase: base, alternates: { canonical: base }, openGraph: { title: site.seoTitle || site.brandName, description: site.seoDescription || site.heroDescription, url: base, siteName: site.brandName, locale: 'zh_TW', type: 'website', images: site.ogImageUrl ? [{ url: site.ogImageUrl }] : undefined } };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body><div id="main-content">{children}</div></body></html>;
}
