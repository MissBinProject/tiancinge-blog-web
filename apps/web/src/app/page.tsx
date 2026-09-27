import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { ServicesSection } from '@/components/ServicesSection';
import { PricingSection } from '@/components/PricingSection';
import { NewsSection, BlogSection } from '@/components/ArticlesSection';
import { ContactSection } from '@/components/ContactSection';
import { Footer } from '@/components/Footer';
import { loadArticles, loadPricingPlans, loadServices, loadSettings } from '@/lib/data';
import { StructuredData } from '@/components/StructuredData';
import { localBusinessSchema, websiteSchema } from '@/lib/seo-schema';
import { buildSeoMetadata } from '@/lib/seo-metadata';
export async function generateMetadata(): Promise<Metadata>{const site=await loadSettings();return buildSeoMetadata({title:site.seoTitle||`${site.brandName}｜${site.tagline}`,description:site.seoDescription||site.heroDescription,path:'/',siteName:site.brandName,imageUrl:site.ogImageUrl});}
export default async function Home(){const [items,plans,news,blog,siteSettings]=await Promise.all([loadServices(),loadPricingPlans(),loadArticles('news'),loadArticles('blog'),loadSettings()]);return <><StructuredData data={localBusinessSchema(siteSettings)}/><StructuredData data={websiteSchema(siteSettings)}/><Header siteSettings={siteSettings}/><main id="main-content" tabIndex={-1}><Hero siteSettings={siteSettings}/><ServicesSection items={items} siteSettings={siteSettings}/><PricingSection items={plans} siteSettings={siteSettings}/><NewsSection items={news} siteSettings={siteSettings}/><BlogSection items={blog} siteSettings={siteSettings}/><ContactSection siteSettings={siteSettings}/></main><Footer siteSettings={siteSettings}/></>}
