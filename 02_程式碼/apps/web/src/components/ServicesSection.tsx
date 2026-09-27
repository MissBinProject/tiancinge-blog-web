import { ArrowRight } from 'lucide-react';
import type { Service, SiteSettings } from '@tian-xin-ge/contracts';
import { SafeImage } from './SafeImage';
const iconAssets: Record<Service['icon'], string> = {
  lotus: '/assets/icons/icon-01.webp',
  oil: '/assets/icons/icon-02.webp',
  stone: '/assets/icons/icon-03.webp',
  foot: '/assets/icons/icon-04.webp',
  flower: '/assets/icons/icon-05.webp',
};
export function ServicesSection({items,siteSettings}:{items:Service[];siteSettings:SiteSettings}){return <section id="services" className="services section" style={siteSettings.servicesBackgroundUrl?{backgroundImage:`url(${siteSettings.servicesBackgroundUrl})`}:undefined}><div className="petals petals-a"/><div className="container"><div className="section-title"><span className="eyebrow">OUR SERVICES</span><h2>{siteSettings.servicesTitle}</h2><p>{siteSettings.servicesSubtitle}</p></div><p className="section-note">{siteSettings.servicesNote}</p><div className="service-grid">{items.map((s)=><a href={`/services/${s.slug}`} className="service-card" key={s.id}><SafeImage src={s.imageUrl} alt={`服務項目：${s.imageAlt || s.name}`}/><div className="service-card-body"><SafeImage className="service-icon-image" src={iconAssets[s.icon]} alt="" fallbackAlt="服務圖示"/><div><h3>{s.name}</h3><p>{s.summary}</p></div><span className="round-arrow"><ArrowRight size={16}/></span></div></a>)}{items.length===0&&<p className="empty">目前沒有可提供的服務。</p>}</div><a className="explore-link" href="/services">探索更多服務 <ArrowRight size={18}/></a></div></section>}
