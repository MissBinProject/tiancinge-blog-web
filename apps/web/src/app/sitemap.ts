import type { MetadataRoute } from 'next';
import { loadArticles, loadServices } from '@/lib/data';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> { const base=(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000').replace(/\/+$/, ''); const [services,articles]=await Promise.all([loadServices(),loadArticles()]); return [{url:base},{url:`${base}/services`},{url:`${base}/news`},{url:`${base}/blog`},{url:`${base}/privacy`},{url:`${base}/terms`},...services.map(s=>({url:`${base}/services/${s.slug}`})),...articles.map(a=>({url:`${base}/${a.type}/${a.slug}`}))]; }
