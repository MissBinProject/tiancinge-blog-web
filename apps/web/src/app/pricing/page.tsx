import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StructuredData } from '@/components/StructuredData';
import { PricingTable } from '@/components/PricingTable';
import { loadPricingPlans, loadSettings } from '@/lib/data';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { breadcrumbSchema } from '@/lib/seo-schema';

export async function generateMetadata(): Promise<Metadata> { const site = await loadSettings(); return buildSeoMetadata({ title: `完整價目表｜${site.brandName}`, description: `查看${site.brandName}的按摩、足部舒壓、全身按摩、精油按摩與組合方案價格。`, path: '/pricing', siteName: site.brandName, imageUrl: site.ogImageUrl }); }

export default async function PricingPage() { const [items, siteSettings] = await Promise.all([loadPricingPlans(), loadSettings()]); return <><Header siteSettings={siteSettings}/><main id="main-content" tabIndex={-1} className="inner-page pricing-page"><div className="container"><StructuredData data={breadcrumbSchema([{ name: '首頁', path: '/' }, { name: '價目表', path: '/pricing' }])}/><Breadcrumbs items={[{ name: '首頁', href: '/' }, { name: '價目表' }]}/></div><div className="inner-hero"><span className="eyebrow">PRICE MENU</span><h1>完整價目表</h1><p>透明收費・安心享受・依需求選擇適合的放鬆方案</p></div><div className="container"><PricingTable items={items} siteSettings={siteSettings}/></div></main><Footer siteSettings={siteSettings}/></>; }
