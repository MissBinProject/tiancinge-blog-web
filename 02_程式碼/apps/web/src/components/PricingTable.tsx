import type { PricingCategory, PricingPlan, SiteSettings } from '@tian-xin-ge/contracts';
import { ArrowRight } from 'lucide-react';

const categories: PricingCategory[] = ['局部舒壓', '足部服務', '全身與精油按摩', '組合方案', '刮痧與拔罐'];

export function PricingTable({ items, siteSettings }: { items: PricingPlan[]; siteSettings: SiteSettings }) {
  return <div className="pricing-table-page">{categories.map((category) => { const rows = items.filter((item) => item.category === category).sort((a, b) => a.sortOrder - b.sortOrder); if (!rows.length) return null; return <section className="pricing-category" key={category}><h2>{category}</h2><div className="pricing-plan-list">{rows.map((plan) => <article className="pricing-plan" key={plan.id}><div className="pricing-plan-main"><div className="pricing-plan-title"><h3>{plan.name}</h3>{plan.isFeatured && <span className="pricing-featured">熱門</span>}</div><p>{plan.description || plan.summary}</p></div><div className="pricing-plan-duration">{plan.durationMinutes != null ? `${plan.durationMinutes} 分鐘` : ''}{plan.durationNote && <small>{plan.durationNote}</small>}</div><strong className="pricing-plan-price">NT$ {plan.price.toLocaleString()}</strong><a className="btn" href={siteSettings.lineUrl}>預約 <ArrowRight size={16}/></a></article>)}</div></section> })}</div>;
}
