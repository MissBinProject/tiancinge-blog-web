import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { ServicesSection } from '@/components/ServicesSection';
import { PricingSection } from '@/components/PricingSection';
import { NewsSection, BlogSection } from '@/components/ArticlesSection';
import { ContactSection } from '@/components/ContactSection';
import { Footer } from '@/components/Footer';
import { loadArticles, loadServices, loadSettings } from '@/lib/data';
export const dynamic = 'force-dynamic';
export default async function Home(){const [items,news,blog,siteSettings]=await Promise.all([loadServices(),loadArticles('news'),loadArticles('blog'),loadSettings()]);return <><Header siteSettings={siteSettings}/><main id="main-content" tabIndex={-1}><Hero siteSettings={siteSettings}/><ServicesSection items={items} siteSettings={siteSettings}/><PricingSection items={items} siteSettings={siteSettings}/><NewsSection items={news} siteSettings={siteSettings}/><BlogSection items={blog} siteSettings={siteSettings}/><ContactSection siteSettings={siteSettings}/></main><Footer siteSettings={siteSettings}/></>}
