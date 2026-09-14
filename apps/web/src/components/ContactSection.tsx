'use client';

import { FormEvent, useState } from 'react';
import { Clock3, Flower2, Mail, MapPin, Phone, Send, UserRound } from 'lucide-react';
import type { SiteSettings } from '@tian-xin-ge/contracts';
import { SafeImage } from './SafeImage';
import { FacebookIcon, InstagramIcon, LineIcon, YoutubeIcon } from './SocialIcons';

export function ContactSection({ siteSettings }: { siteSettings: SiteSettings }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    setState('sending');
    const form = new FormData(formElement);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(form)),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('contact request failed');
      formElement.reset();
      setState('sent');
    } catch {
      setState('error');
    }
  };

  const hasLine = /^https:\/\/[^\s]+$/i.test(siteSettings.lineUrl);
  const qr = hasLine
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(siteSettings.lineUrl)}`
    : '';

  return <section id="contact" className="contact section">
    <div className="contact-bg" style={siteSettings.contactBackgroundUrl ? { backgroundImage: `url(${siteSettings.contactBackgroundUrl})` } : undefined} />
    <p className="contact-decor contact-side-copy" aria-hidden="true">放鬆<br />是給自己<br />最溫柔的<br />禮物<br /><span>—<br />A<br />BETTER<br />YOU<br />ALWAYS<br />HERE</span><Flower2 /></p>
    <p className="contact-decor contact-handwritten" aria-hidden="true">有任何問題<br />歡迎與我們聯繫<br />讓美好從這裡開始 <b>♥</b></p>
    <p className="contact-decor contact-room-copy" aria-hidden="true">放鬆身心<br />找回最美的自己</p>
    <div className="container contact-layout">
      <div className="contact-copy">
        <span className="eyebrow">CONTACT US</span>
        <h2>{siteSettings.contactTitle}</h2>
        <p className="contact-lead">{siteSettings.contactLead}</p>
        <div className="contact-details">
          <a href={`tel:${siteSettings.phone}`}><Phone /> {siteSettings.phone}</a>
          <a href={hasLine ? siteSettings.lineUrl : '#contact'}><span className="line-badge">LINE</span> {siteSettings.lineId || 'LINE 尚未設定'}</a>
          <span><MapPin /> {siteSettings.address}</span>
          <span><Clock3 /> 營業時間 {siteSettings.businessHours}</span>
        </div>
        <form className="contact-form" onSubmit={submit}>
          <label><UserRound /><input required name="name" aria-label="您的姓名" autoComplete="name" placeholder="您的姓名" /></label>
          <label><Phone /><input required name="phone" aria-label="聯絡電話" autoComplete="tel" placeholder="聯絡電話" inputMode="tel" /></label>
          <label><Mail /><input name="email" aria-label="電子郵件" autoComplete="email" type="email" placeholder="電子郵件" /></label>
          <label><Send /><textarea required name="message" aria-label="您的需求或留言" placeholder="您的需求或留言" rows={3} /></label>
          <button className="btn" disabled={state === 'sending'}>{state === 'sending' ? '傳送中…' : state === 'sent' ? '已送出，謝謝您' : '送出訊息'} <span>→</span></button>
          {state === 'sent' && <p className="form-success" role="status">留言已成功送出，我們會盡快與您聯繫。</p>}
          {state === 'error' && <p className="form-error" role="alert">送出失敗，請稍後再試或直接透過 LINE 聯繫。</p>}
        </form>
      </div>
      <div className="contact-media">
        <div className="map-wrap">{siteSettings.mapEmbedUrl ? <iframe title="天心閣位置" src={siteSettings.mapEmbedUrl} loading="lazy" /> : <p className="map-empty" role="status">地圖尚未設定</p>}</div>
        <div className="social-panel">
          {hasLine ? <a className="qr-placeholder" href={siteSettings.lineUrl} aria-label="開啟 LINE" target="_blank" rel="noreferrer"><SafeImage src={qr} alt={`掃描加入 ${siteSettings.lineId} LINE`} /></a> : <div className="qr-empty" role="status">LINE 尚未設定</div>}
          <div className="social-links">
            <a className="line" href={siteSettings.social.line} aria-label="LINE"><LineIcon /><span>LINE</span></a>
            <a className="instagram" href={siteSettings.social.instagram} aria-label="Instagram"><InstagramIcon /><span>Instagram</span></a>
            <a className="facebook" href={siteSettings.social.facebook} aria-label="Facebook"><FacebookIcon /><span>Facebook</span></a>
            <a className="youtube" href={siteSettings.social.youtube} aria-label="YouTube"><YoutubeIcon /><span>YouTube</span></a>
          </div>
        </div>
      </div>
    </div>
  </section>;
}
