import Link from 'next/link';
import type { SiteSettings } from '@tian-xin-ge/contracts';
import { SafeImage } from './SafeImage';
export function Footer({siteSettings}:{siteSettings:SiteSettings}){return <footer className="footer"><div className="container footer-inner"><Link href="/" className="footer-brand"><SafeImage src={siteSettings.logoUrl} alt="" width={1254} height={1254}/><span>{siteSettings.tagline}<small>RELAX・RECHARGE・BE A BETTER YOU</small></span></Link><nav><Link href="/">首頁</Link><Link href="/pricing">價目表</Link><Link href="/news">最新消息</Link><Link href="/blog">部落格</Link><Link href="/#contact">聯繫我們</Link></nav><p>© 2025 {siteSettings.brandName}　|　<Link href="/privacy">隱私權政策</Link>　|　<Link href="/terms">服務條款</Link></p></div></footer>}
