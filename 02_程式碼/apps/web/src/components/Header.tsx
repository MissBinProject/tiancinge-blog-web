'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Menu, X, CalendarCheck } from 'lucide-react';
import type { SiteSettings } from '@tian-xin-ge/contracts';
import { SafeImage } from './SafeImage';
import styles from './Header.module.css';
import { FacebookIcon, InstagramIcon, LineIcon } from './SocialIcons';

const links = [['首頁','/'],['價目表','/pricing'],['最新消息','/news'],['部落格','/blog']];

export function Header({siteSettings}:{siteSettings:SiteSettings}){
  const pathname = usePathname();
  const pageSection = pathname === '/' ? 'home' : pathname.startsWith('/pricing') ? 'pricing' : pathname.startsWith('/news') ? 'news' : pathname.startsWith('/blog') ? 'blog' : '';
  const [open,setOpen]=useState(false);
  const [active,setActive]=useState(pageSection);
  useEffect(()=>{
    setActive(pageSection);
    if (pathname !== '/') return;
    const sections=['home','pricing','news','blog'].filter((id)=>document.getElementById(id));
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
    <a href="/" className="brand"><SafeImage src={siteSettings.logoUrl} alt={siteSettings.brandName} width={1254} height={1254} loading="eager"/><span>{siteSettings.brandName}<small>TIAN XIN GE<br/>WELLNESS SPA</small></span></a>
    <nav id="site-nav" className={open?'nav open':'nav'}>{links.map(([label,href])=>{const id=href==='/'?'home':href.slice(1);return <a key={href} href={href} aria-current={active===id?'page':undefined} onClick={()=>{setOpen(false);setActive(id)}}>{label}</a>})}</nav>
    <div className="header-actions"><a href={siteSettings.lineUrl} className="header-book"><CalendarCheck size={16}/>立即預約</a><a href={siteSettings.social.line} aria-label="LINE"><LineIcon/></a><a href={siteSettings.social.instagram} aria-label="Instagram"><InstagramIcon/></a><a href={siteSettings.social.facebook} aria-label="Facebook"><FacebookIcon/></a><a href="/search" aria-label="搜尋"><Search size={20}/></a><button className="menu-btn" aria-label={open?'關閉選單':'開啟選單'} aria-expanded={open} aria-controls="site-nav" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div>
  </div></header>
}
