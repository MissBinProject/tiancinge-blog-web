'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Menu, X, CalendarCheck } from 'lucide-react';
import { settings } from '@/lib/data';
import type { SiteSettings } from '@tian-xin-ge/contracts';
import { SafeImage } from './SafeImage';
import styles from './Header.module.css';

const links = [['首頁','/#home'],['服務項目','/#services'],['價格','/#pricing'],['最新消息','/#news'],['部落格','/#blog'],['聯繫我們','/#contact']];

function LineIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="2" y="2" width="20" height="20" rx="5" fill="currentColor" /><path d="M6.5 11.4c0-2.15 2.24-3.9 5-3.9s5 1.75 5 3.9-2.24 3.9-5 3.9c-.54 0-1.06-.07-1.55-.2L7.4 16l.68-1.35c-.98-.72-1.58-1.9-1.58-3.25Z" fill="white" /><path d="M9 10.7h5M9 12.1h3.5" stroke="currentColor" strokeWidth=".8" strokeLinecap="round" /></svg>;
}

function InstagramIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.4" cy="6.7" r="1.2" fill="currentColor" /></svg>;
}

function FacebookIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" /><path d="M13.6 19v-6h2l.3-2.2h-2.3V9.4c0-.64.18-1.08 1.1-1.08H16V6.35c-.23-.03-.92-.1-1.75-.1-1.73 0-2.92 1.06-2.92 3v1.55H9.4V13h1.93v6h2.27Z" fill="white" /></svg>;
}

export function Header({siteSettings=settings}:{siteSettings?:SiteSettings}){
  const pathname = usePathname();
  const pageSection = pathname === '/' ? 'home' : pathname.startsWith('/services') ? 'services' : pathname.startsWith('/news') ? 'news' : pathname.startsWith('/blog') ? 'blog' : '';
  const [open,setOpen]=useState(false);
  const [active,setActive]=useState(pageSection);
  useEffect(()=>{
    setActive(pageSection);
    if (pathname !== '/') return;
    const sections=links.map(([,href])=>href.replace('/#','')).filter((id)=>document.getElementById(id));
    if(!sections.length)return;
    const observer=new IntersectionObserver((entries)=>{
      const visible=entries.filter((entry)=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(visible)setActive(visible.target.id);
    },{rootMargin:'-24% 0px -58% 0px',threshold:[0,.25,.6]});
    sections.forEach((id)=>{const element=document.getElementById(id);if(element)observer.observe(element)});
    return()=>observer.disconnect();
  },[pageSection, pathname]);
  useEffect(()=>{const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)};window.addEventListener('keydown',closeOnEscape);return()=>window.removeEventListener('keydown',closeOnEscape)},[]);
  return <header className="site-header"><a className={styles.skipLink} href="#main-content">跳到主要內容</a><div className="header-inner container">
    <a href="/#home" className="brand"><SafeImage src={siteSettings.logoUrl} alt={siteSettings.brandName}/><span>{siteSettings.brandName}<small>TIAN XIN GE<br/>WELLNESS SPA</small></span></a>
    <nav id="site-nav" className={open?'nav open':'nav'}>{links.map(([label,href])=>{const id=href.replace('/#','');return <a key={href} href={href} aria-current={active===id?'location':undefined} onClick={()=>{setOpen(false);setActive(id)}}>{label}</a>})}</nav>
    <div className="header-actions"><a href={siteSettings.lineUrl} className="header-book"><CalendarCheck size={16}/>立即預約</a><a href={siteSettings.social.line} aria-label="LINE"><LineIcon/></a><a href={siteSettings.social.instagram} aria-label="Instagram"><InstagramIcon/></a><a href={siteSettings.social.facebook} aria-label="Facebook"><FacebookIcon/></a><a href="/search" aria-label="搜尋"><Search size={20}/></a><button className="menu-btn" aria-label={open?'關閉選單':'開啟選單'} aria-expanded={open} aria-controls="site-nav" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div>
  </div></header>
}
