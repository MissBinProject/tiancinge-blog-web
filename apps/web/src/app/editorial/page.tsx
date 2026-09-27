import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StructuredData } from '@/components/StructuredData';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { absoluteSiteUrl } from '@/lib/site-url';
import { loadSettings } from '@/lib/data';

export async function generateMetadata(): Promise<Metadata> {
  const site = await loadSettings();
  const name = site.editorialTeamName || site.brandName + '編輯團隊';
  const complete = Boolean(site.editorialBio?.trim() && site.editorialPolicy?.trim());
  return buildSeoMetadata({ title: name + '｜' + site.brandName, description: site.editorialBio || '編輯團隊資訊尚未提供。', path: '/editorial', siteName: site.brandName, imageUrl: site.ogImageUrl, noIndex: !complete });
}

export default async function EditorialPage() {
  const site = await loadSettings();
  const name = site.editorialTeamName || site.brandName + '編輯團隊';
  const description = site.editorialBio || '編輯團隊介紹尚未提供。';
  const policy = site.editorialPolicy || '內容更新原則尚未提供。';
  return <><Header siteSettings={site}/><main id="main-content" tabIndex={-1} className="policy-page"><div className="container"><StructuredData data={{ '@context': 'https://schema.org', '@type': 'Organization', '@id': absoluteSiteUrl('/editorial') + '#organization', name, url: absoluteSiteUrl('/editorial'), description, parentOrganization: { '@id': absoluteSiteUrl('/') + '#business' } }}/><nav className="breadcrumbs" aria-label="麵包屑"><a href="/">首頁</a><span aria-hidden="true">／</span><span>編輯團隊</span></nav><span className="eyebrow">EDITORIAL TEAM</span><h1>{name}</h1><p>{description}</p><h2>內容更新原則</h2><p className="policy-content">{policy}</p></div></main><Footer siteSettings={site}/></>;
}
