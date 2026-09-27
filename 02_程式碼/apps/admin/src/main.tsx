import React, { useEffect, useMemo, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Image as ImageIcon, Settings, Sparkles, Newspaper, Mail, Menu, Save, Plus, Trash2, ExternalLink, History } from 'lucide-react';
import { createContentCode, fixtureArticles, fixtureCategories, fixtureMedia, fixtureMessages, fixturePricingPlans, fixtureServices, fixtureSettings, isServiceSlug, isSafeContentUrl, type PricingPlan, type Service } from '@tian-xin-ge/contracts';
import './styles.css';
import { CoverImagePicker } from './components/CoverImagePicker';
import { ArticleManagement } from './features/articles/ArticleManagement';
import { serviceQualityWarnings } from './features/services/service-quality';
import { MediaUploadProgress, type MediaUploadProgressState } from './components/MediaUploadProgress';
import { resolveMediaUrl } from './lib/media-url';
import { restoreServerSession, signInWithServerAccount, signOutServerAccount } from './features/auth/infrastructure/serverAccountClient';
import { isServerAdminApiEnabled } from './features/auth/infrastructure/adminApi';
import { WebReleaseHistory } from './features/releases/WebReleaseHistory';
import { deleteMedia, deleteMessage, deletePricingPlan, deleteService, loadArticles, loadCategories, loadMedia, loadMessages, loadPricingPlans, loadServices, loadSettings, saveMediaAlt, saveMessage, savePricingPlan, saveService, saveSettings, uploadMedia, type AdminCategory, type ManagedArticle, type AdminMessage, type AdminMedia } from './repositories';

const webOrigin = (import.meta.env.VITE_WEB_URL || 'http://localhost:3000').replace(/\/+$/, '');
const serverAuthEnabled = isServerAdminApiEnabled();
const adminRemoteEnabled = serverAuthEnabled;
const seedServices: Service[] = fixtureServices.map((service) => ({ ...service }));
const seedPricingPlans: PricingPlan[] = fixturePricingPlans.map((plan) => ({ ...plan, id: `local-${plan.id}`, imageUrl: plan.imageUrl || '/assets/crops/service-1.webp', imageAlt: plan.imageAlt || plan.name }));
const seedArticles: ManagedArticle[] = fixtureArticles.map((article) => ({ ...article, id: `local-${article.id}`, body: JSON.stringify(article.body) }));
const seedCategories: AdminCategory[] = fixtureCategories.map((category) => ({ ...category, id: `local-${category.id}` }));
const seedMessages: AdminMessage[] = fixtureMessages.map((message) => ({ ...message, id: `local-${message.id}` }));
const seedMedia: AdminMedia[] = fixtureMedia.map(({ createdAt: _createdAt, ...media }) => ({ ...media, id: `local-${media.id}` }));
const seedSettings = {
  brandName: fixtureSettings.brandName,
  phone: fixtureSettings.phone,
  line: fixtureSettings.lineId,
  address: fixtureSettings.address,
  hours: fixtureSettings.businessHours,
  mapEmbedUrl: fixtureSettings.mapEmbedUrl,
  instagram: fixtureSettings.social.instagram ?? '#',
  facebook: fixtureSettings.social.facebook ?? '#',
  youtube: fixtureSettings.social.youtube ?? '#',
  logoUrl: fixtureSettings.logoUrl,
  heroTitle: fixtureSettings.heroTitle,
  heroSubtitle: fixtureSettings.heroSubtitle,
  tagline: fixtureSettings.tagline,
  heroDescription: fixtureSettings.heroDescription,
  heroBackgroundUrl: fixtureSettings.heroBackgroundUrl,
  servicesTitle: fixtureSettings.servicesTitle,
  servicesSubtitle: fixtureSettings.servicesSubtitle,
  servicesNote: fixtureSettings.servicesNote,
  servicesBackgroundUrl: fixtureSettings.servicesBackgroundUrl,
  pricingTitle: fixtureSettings.pricingTitle,
  pricingSubtitle: fixtureSettings.pricingSubtitle,
  pricingBackgroundUrl: fixtureSettings.pricingBackgroundUrl,
  newsTitle: fixtureSettings.newsTitle,
  newsSubtitle: fixtureSettings.newsSubtitle,
  newsBackgroundUrl: fixtureSettings.newsBackgroundUrl,
  blogTitle: fixtureSettings.blogTitle,
  blogSubtitle: fixtureSettings.blogSubtitle,
  blogBackgroundUrl: fixtureSettings.blogBackgroundUrl,
  contactTitle: fixtureSettings.contactTitle,
  contactLead: fixtureSettings.contactLead,
  contactBackgroundUrl: fixtureSettings.contactBackgroundUrl,
  benefits: fixtureSettings.benefits,
  pricingBenefits: fixtureSettings.pricingBenefits,
  privacy: fixtureSettings.privacyText,
  terms: fixtureSettings.termsText,
  seoTitle: fixtureSettings.seoTitle,
  seoDescription: fixtureSettings.seoDescription,
  ogImageUrl: fixtureSettings.ogImageUrl,
  editorialTeamName: fixtureSettings.editorialTeamName ?? '天心閣養生會館編輯團隊',
  editorialBio: fixtureSettings.editorialBio ?? '',
  editorialPolicy: fixtureSettings.editorialPolicy ?? '',
};
type AdminSettings = typeof seedSettings & { version?: number };

function normalizeAdminSettings(value: Partial<AdminSettings>): AdminSettings {
  const defined = Object.fromEntries(Object.entries(value).filter(([, item]) => item !== null && item !== undefined));
  return { ...seedSettings, ...defined } as AdminSettings;
}

function useStored<T>(_key: string, initial: T, loader?: () => Promise<T | null>) {
  // Content, messages and settings can contain personal or unpublished data.
  // Keep the current working copy in memory only; the server is the source of truth.
  const [value, setValue] = useState<T>(initial);
  const [loading, setLoading] = useState(Boolean(loader && adminRemoteEnabled));
  const [loadError, setLoadError] = useState(false);
  useEffect(() => { if (!loader || !adminRemoteEnabled) return; setLoadError(false); void loader().then((remote) => { if (remote !== null) setValue(remote); else setLoadError(true); }).catch(() => setLoadError(true)).finally(() => setLoading(false)); }, [loader]);
  return [value, setValue, loading, loadError] as const;
}

function clearLegacyBrowserData() {
  if (typeof window === 'undefined') return;
  for (const key of ['txg-services', 'txg-pricing', 'txg-messages', 'txg-settings', 'txg-articles', 'txg-categories', 'txg-media']) {
    window.localStorage.removeItem(key);
  }
}

const unsavedForms = new Set<string>();
function hasUnsavedChanges() { return unsavedForms.size > 0; }

function useUnsavedWarning(enabled: boolean, key: string) {
  useEffect(() => {
    if (!enabled) { unsavedForms.delete(key); return; }
    unsavedForms.add(key);
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => { window.removeEventListener('beforeunload', warn); unsavedForms.delete(key); };
  }, [enabled, key]);
}

function App() {
  useEffect(() => { clearLegacyBrowserData(); }, []);
  const [logged, setLogged] = useState(() => !serverAuthEnabled && !import.meta.env.PROD && sessionStorage.getItem('tian-admin') === '1');
  const [authNotice, setAuthNotice] = useState('');
  useEffect(() => {
    if (!serverAuthEnabled) return;
    let disposed = false;
    void restoreServerSession().then((result) => {
      if (disposed) return;
      if (result.ok) { sessionStorage.setItem('tian-admin', '1'); setLogged(true); setAuthNotice(''); }
      else { sessionStorage.removeItem('tian-admin'); setLogged(false); if (result.reason === 'unavailable' || result.reason === 'network') setAuthNotice('目前無法驗證登入服務，請稍後再試'); }
    });
    return () => { disposed = true; };
  }, []);
  const logout = async () => { if (serverAuthEnabled) await signOutServerAccount(); sessionStorage.removeItem('tian-admin'); clearLegacyBrowserData(); setLogged(false); };
  return logged ? <Dashboard onLogout={logout} /> : <Login notice={authNotice} onLogin={() => { sessionStorage.setItem('tian-admin', '1'); setAuthNotice(''); setLogged(true); }} />;
}

function Login({ onLogin, notice }: { onLogin: () => void; notice?: string }) {
  const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [otp, setOtp] = useState(''); const [recoveryCode, setRecoveryCode] = useState(''); const [mfaRequired, setMfaRequired] = useState(false); const [recoveryMode, setRecoveryMode] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(''); setMessage(''); if (!username.trim() || !password) { setError('請輸入管理員帳號與密碼'); return; } if (mfaRequired && ((!recoveryMode && !/^\d{6}$/.test(otp)) || (recoveryMode && !/^[0-9A-HJKMNP-TV-Z]{4}(?:[-\s]?[0-9A-HJKMNP-TV-Z]{4}){3}$/i.test(recoveryCode)))) { setError(recoveryMode ? '請輸入 16 位數恢復碼' : '請輸入 6 位數驗證碼'); return; } setBusy(true); if (serverAuthEnabled) { const result = await signInWithServerAccount(username, password, recoveryMode ? '' : otp, recoveryMode ? recoveryCode : ''); if (!result.ok) { const messages: Record<string, string> = { invalid: '帳號或密碼不正確', rate_limited: '登入嘗試次數過多，請稍後再試', origin_denied: '請從後台網站登入', unavailable: '目前無法驗證登入服務，請稍後再試', network: '目前無法連線登入服務，請稍後再試', mfa_required: '請輸入驗證器代碼或一次性恢復碼' }; if (result.reason === 'mfa_required') setMfaRequired(true); setError(messages[result.reason]); setBusy(false); return; } onLogin(); setBusy(false); return; } if (import.meta.env.PROD || username.trim().toLowerCase() !== 'tiancinge') { setError(import.meta.env.PROD ? '正式環境必須啟用伺服器登入服務' : '帳號或密碼不正確'); setBusy(false); return; } onLogin(); setBusy(false); };
  const reset = () => { setError(''); setMessage('請聯絡網站維護者重設管理員密碼。'); };
  return <div className="login-page"><div className="login-card"><img src={`${webOrigin}/assets/logo/logo_1_去背.png`} alt="天心閣" /><p>天心閣養生會館</p><h1>內容管理後台</h1>{notice && <p className="auth-notice" role="status">{notice}</p>}<form onSubmit={submit}><label>管理員帳號<input value={username} onChange={(e) => setUsername(e.target.value)} type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="請輸入帳號" /></label><label>密碼<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" placeholder="••••••••" /></label>{mfaRequired && !recoveryMode && <label>驗證器代碼<input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" placeholder="6 位數代碼" /></label>}{mfaRequired && recoveryMode && <label>一次性恢復碼<input value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value.toUpperCase().replace(/[^0-9A-HJKMNP-TV-Z\s-]/g, '').slice(0, 19))} type="text" autoComplete="one-time-code" spellCheck={false} placeholder="XXXX-XXXX-XXXX-XXXX" /></label>}{mfaRequired && <button type="button" className="text-btn" onClick={() => { setRecoveryMode(!recoveryMode); setOtp(''); setRecoveryCode(''); }}>{recoveryMode ? '改用驗證器代碼' : '使用一次性恢復碼登入'}</button>}{error && <small className="error" role="alert">{error}</small>}{message && <small className="muted" role="status">{message}</small>}<button className="primary" disabled={busy}>{busy ? '登入中…' : '登入後台'}</button><button type="button" className="text-btn" onClick={reset}>需要重設密碼？</button></form><small>{serverAuthEnabled ? '登入由網站伺服器驗證，資料操作使用安全 session' : '僅限本機開發模式使用測試登入'}</small></div></div>;
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const location = useLocation(); const navigate = useNavigate(); const [collapsed, setCollapsed] = useState(false); const active = ({ '/': 'overview', '/services': 'services', '/pricing': 'pricing', '/articles': 'articles', '/news': 'news', '/blog': 'blog', '/media': 'media', '/messages': 'messages', '/releases': 'releases', '/settings': 'settings' } as Record<string, string>)[location.pathname] || 'overview'; const go = (id: string) => { if (hasUnsavedChanges() && !window.confirm('有尚未儲存的變更，確定要離開嗎？')) return; navigate(id === 'overview' ? '/' : `/${id}`); };
  const [services, setServices, servicesLoading, servicesError] = useStored('txg-services', seedServices, loadServices);
  const [pricing, setPricing, pricingLoading, pricingError] = useStored('txg-pricing', seedPricingPlans, loadPricingPlans);
  const [messages, setMessages, messagesLoading, messagesError] = useStored<AdminMessage[]>('txg-messages', seedMessages, loadMessages);
  const [settings, setSettings, settingsLoading, settingsError] = useStored<AdminSettings>('txg-settings', seedSettings, loadSettings);
  const [articles, setArticles, articlesLoading, articlesError] = useStored<ManagedArticle[]>('txg-articles', seedArticles, loadArticles);
  const [categories, setCategories, categoriesLoading, categoriesError] = useStored<AdminCategory[]>('txg-categories', seedCategories, loadCategories);
  const [media, setMedia, mediaLoading, mediaError] = useStored<AdminMedia[]>('txg-media', seedMedia, loadMedia);
  const remoteLoading = Boolean(adminRemoteEnabled && (servicesLoading || pricingLoading || messagesLoading || settingsLoading || articlesLoading || categoriesLoading || mediaLoading));
  const remoteLoadError = servicesError || pricingError || messagesError || settingsError || articlesError || categoriesError || mediaError;
  const canRenderData = !adminRemoteEnabled || (!remoteLoading && !remoteLoadError);
  const labels: Record<string, string> = { overview: '總覽', services: '服務內容', pricing: '價目表', articles: '文章管理', news: '最新消息', blog: '部落格', media: '素材管理', messages: '聯絡留言', releases: '發布紀錄', settings: '網站設定' };
  const setArticleDirty = React.useCallback((dirty: boolean) => { if (dirty) unsavedForms.add('articles'); else unsavedForms.delete('articles'); }, []);
  const logout = () => { if (hasUnsavedChanges() && !window.confirm('有尚未儲存的變更，確定要登出嗎？')) return; onLogout(); };
  return <div className={collapsed ? 'admin-shell collapsed' : 'admin-shell'}><aside><div className="admin-brand"><img src={`${webOrigin}/assets/logo/logo_1_去背.png`} alt="" /><span>天心閣<small>管理後台</small></span></div><nav><Nav icon={<LayoutDashboard />} label="總覽" id="overview" active={active} set={go} /><Nav icon={<Sparkles />} label="服務內容" id="services" active={active} set={go} /><Nav icon={<Sparkles />} label="價目表" id="pricing" active={active} set={go} /><Nav icon={<Newspaper />} label="最新消息" id="news" active={active} set={go} /><Nav icon={<Newspaper />} label="部落格" id="blog" active={active} set={go} /><Nav icon={<ImageIcon />} label="素材管理" id="media" active={active} set={go} /><Nav icon={<Mail />} label="聯絡留言" id="messages" active={active} set={go} /><Nav icon={<History />} label="發布紀錄" id="releases" active={active} set={go} /><Nav icon={<Settings />} label="網站設定" id="settings" active={active} set={go} /></nav><button className="logout" onClick={logout}><LogOut />登出</button></aside><section className="admin-main"><header><button className="icon-btn" aria-label={collapsed ? '展開選單' : '收合選單'} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}><Menu /></button><div><h1>{labels[active]}</h1><small>天心閣養生會館 / 管理後台</small></div><a href={webOrigin} target="_blank" rel="noreferrer" className="view-site">查看網站 <ExternalLink size={15} /></a></header><div className="admin-content" aria-busy={active !== 'releases' && remoteLoading}>{active === 'releases' ? <WebReleaseHistory /> : remoteLoading ? <div className="loading-overlay" role="status">正在載入伺服器正式資料…</div> : remoteLoadError ? <div className="error-banner" role="alert">正式資料讀取失敗，為避免顯示過期或未發布資料，已暫停顯示內容。請檢查網站伺服器連線後重新整理。</div> : canRenderData ? <>{active === 'overview' && <Overview services={services} messages={messages} articles={articles} mediaCount={media.length} loading={servicesLoading || messagesLoading} />} {active === 'services' && <ServicesEditor values={services} setValues={setServices} media={media} />} {active === 'pricing' && <PricingEditor values={pricing} setValues={setPricing} media={media} />} {(active === 'articles' || active === 'news' || active === 'blog') && <ArticleManagement type={active === 'blog' ? 'blog' : 'news'} values={articles} setValues={setArticles} loading={articlesLoading} media={media} setMedia={setMedia} categories={categories} setCategories={setCategories} categoriesLoading={categoriesLoading} webOrigin={webOrigin} remoteEnabled={adminRemoteEnabled} onDirtyChange={setArticleDirty} />} {active === 'media' && <MediaEditor values={media} setValues={setMedia} loading={mediaLoading} />} {active === 'messages' && <MessagesEditor values={messages} setValues={setMessages} />} {active === 'settings' && <><SettingsEditor value={settings} setValue={setSettings} loading={settingsLoading} media={media} /><HomeContentEditor value={settings} setValue={setSettings} media={media} /></>}</> : null}</div></section></div>;
}
function Nav({ icon, label, id, active, set }: { icon: React.ReactNode; label: string; id: string; active: string; set: (id: string) => void }) { return <button className={active === id ? 'side-nav active' : 'side-nav'} aria-current={active === id ? 'page' : undefined} aria-label={label} onClick={() => set(id)}>{icon}<span>{label}</span></button>; }
function Overview({ services, messages, articles, mediaCount, loading }: { services: Service[]; messages: AdminMessage[]; articles: ManagedArticle[]; mediaCount: number; loading: boolean }) { return <div><div className="welcome"><div><span className="eyebrow">WELCOME BACK</span><h2>今天也一起讓生活更美好</h2><p>從這裡管理網站內容，儲存後重新整理官網即可看見更新。</p></div><a className="primary" href={webOrigin} target="_blank" rel="noreferrer">前往官網 <ExternalLink size={15} /></a></div><div className="stats"><Stat label="上架服務" value={services.filter((s) => s.isVisible).length} /><Stat label="文章總數" value={articles.length} /><Stat label="未處理留言" value={messages.filter((m) => m.status === 'unread').length} /><Stat label="素材數量" value={mediaCount} /></div><div className="panel quick"><h3>快速操作</h3><p>{loading ? '正在載入資料…' : '使用左側選單編輯固定版型內容，所有表單都有儲存前驗證。'}</p><div><span>✓　公開頁面資料與後台分離</span><span>✓　草稿不會出現在官網</span><span>✓　圖片 10 MB／影片 25 MB</span></div></div></div>; }
function Stat({ label, value }: { label: string; value: string | number }) { return <div className="stat"><small>{label}</small><strong>{value}</strong><span>管理內容　→</span></div>; }

function MediaPicker({ value, onChange, files }: { value: string; onChange: (asset: Pick<AdminMedia, 'id' | 'url' | 'alt'>) => void; files: AdminMedia[] }) {
  const images = files.filter((file) => file.mimeType.startsWith('image/'));
  return <div className="media-picker"><span>快速選擇素材</span><div>{images.map((file) => <button type="button" key={file.id} className={file.url === value ? 'selected' : ''} aria-label={`選擇 ${file.name}`} aria-pressed={file.url === value} onClick={() => onChange(file)}><img src={resolveMediaUrl(file.url, webOrigin)} alt={file.alt || ''} /><small>{file.name}</small></button>)}</div>{images.length === 0 && <small className="muted">請先至素材管理上傳圖片</small>}</div>;
}

function validateService(service: Service, values: Service[]): string | null {
  if (!service.name.trim() || !service.slug.trim()) return '服務名稱與網址代稱為必填';
  if (!isServiceSlug(service.slug.trim())) return '服務網址格式不正確';
  if (values.some((item) => item.id !== service.id && item.slug.trim().toLowerCase() === service.slug.trim().toLowerCase())) return 'slug 不可重複';
  if (service.name.length > 120 || service.summary.length > 240 || service.description.length > 2000 || (service.imageAlt || '').length > 160 || (service.seoTitle || '').length > 160 || (service.seoDescription || '').length > 300 || (service.process || '').length > 2000 || (service.suitableFor || '').length > 2000 || (service.precautions || '').length > 2000 || (service.faq || '').length > 2000) return '名稱最多 120 字、摘要 240 字、介紹與服務詳情各 2000 字、SEO 標題 160 字、SEO 描述 300 字、圖片替代文字 160 字';
  if (!isSafeContentUrl(service.imageUrl, true)) return '圖片網址必須是 https:// 或網站內部路徑';
  if (service.durationMinutes !== undefined && (!Number.isInteger(service.durationMinutes) || service.durationMinutes < 0 || service.durationMinutes > 1440)) return '療程分鐘必須介於 0 到 1440';
  if (service.price !== undefined && (!Number.isInteger(service.price) || service.price < 0 || service.price > 10_000_000)) return '價格必須是有效的非負整數';
  if (service.priceLabel && service.price !== undefined) return '固定價格與洽詢文字不可同時設定';
  if (service.priceLabel && service.priceLabel.length > 80) return '價格顯示文字最多 80 字';
  return null;
}

function validateSettingsFields(value: typeof seedSettings): string | null {
  const normalized = normalizeAdminSettings(value);
  if (!normalized.brandName.trim() || !normalized.phone.trim() || !normalized.line.trim() || !normalized.address.trim() || !normalized.hours.trim()) return '品牌、電話、LINE、地址與營業時間為必填';
  if (normalized.editorialTeamName.length > 120 || normalized.editorialBio.length > 3000 || normalized.editorialPolicy.length > 3000) return '編輯團隊欄位超過長度限制';
  if (normalized.brandName.length > 120 || normalized.phone.length > 40 || normalized.line.length > 120 || normalized.address.length > 240 || normalized.hours.length > 120) return '品牌或聯絡資料超過欄位長度限制';
  if (normalized.mapEmbedUrl && !/^https:\/\/[^\s]+$/i.test(normalized.mapEmbedUrl.trim())) return '地圖 Embed URL 必須使用有效的 https:// 網址';
  if (!/^https:\/\/[^\s]+$/i.test(normalized.line.trim()) && !/^@?[A-Za-z0-9._-]{1,120}$/.test(normalized.line.trim())) return 'LINE 請輸入 ID 或有效的 https:// 連結';
  return null;
}

function ServicesEditor({ values, setValues, media }: { values: Service[]; setValues: (values: Service[]) => void; media: AdminMedia[] }) {
  const [selectedId, setSelectedId] = useState(values[0]?.id); const [notice, setNotice] = useState(''); const [dirty, setDirty] = useState(false); const current = values.find((item) => item.id === selectedId) || values[0];
  const [editing, setEditing] = useState(false);
  const [choosingImage, setChoosingImage] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('all');
  const leave = () => { if (dirty && !window.confirm('有尚未儲存的服務變更，確定要返回清單嗎？')) return; setDirty(false); setEditing(false); setNotice(''); };
  useUnsavedWarning(dirty, 'services');
  const selectService = (id: string) => {  if (dirty && !window.confirm('有尚未儲存的服務變更，確定要切換嗎？')) return; setSelectedId(id); setDirty(false); setNotice(''); setEditing(true); };
  const update = (key: keyof Service, value: unknown) => { if (!current) return; setValues(values.map((item) => item.id === current.id ? { ...item, [key]: value } : item)); setDirty(true); };
  const save = async () => { if (!current) return; const validationError = validateService(current, values); if (validationError) { setNotice(validationError); return; } const result = await saveService(current); if (result.ok && 'id' in result && result.id && result.id !== current.id) { setValues(values.map((item) => item.id === current.id ? { ...current, id: result.id, version: result.version } : item)); setSelectedId(result.id); } else if (result.ok && result.version) setValues(values.map((item) => item.id === current.id ? { ...current, version: result.version } : item)); if (result.ok) setDirty(false); const warnings = serviceQualityWarnings(current); setNotice(result.ok ? (warnings.length ? `服務已儲存；SEO 提醒：${warnings.join('、')}` : '服務已儲存') : `儲存失敗：${result.error}`); };
  const add = () => { const id = `local-${Date.now()}`; const next: Service = { id, slug: createContentCode(), name: '新服務項目', summary: '', description: '', imageUrl: adminRemoteEnabled ? '' : '/assets/crops/service-1.png', icon: 'lotus', sortOrder: values.length + 1, isVisible: false }; setValues([...values, next]); setSelectedId(id); setDirty(true); setEditing(true); setNotice(''); };
  const remove = async () => { if (!current || !confirm('確定刪除此項目？')) return; const result = await deleteService(current.id); if (!result.ok) { setNotice(`刪除失敗：${result.error}`); return; } const remaining = values.filter((item) => item.id !== current.id); setValues(remaining); setSelectedId(remaining[0]?.id || ''); setDirty(false); setNotice('服務已刪除'); setEditing(false); };
  if (!editing) return <section className="panel article-list-page article-full-panel">
    <div className="panel-heading article-list-heading"><div><h3>服務項目管理</h3><p className="muted">共 {values.length} 項服務，點擊編輯後進入服務編輯畫面。</p></div><button type="button" className="small-btn" onClick={add}><Plus size={15} />新增服務</button></div>
    {notice && <p role="status" className="form-notice">{notice}</p>}
    <div className="article-filters article-list-filters"><input aria-label="搜尋服務" placeholder="搜尋服務名稱或摘要" value={keyword} onChange={(e) => setKeyword(e.target.value)} /><select aria-label="服務狀態" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">全部狀態</option><option value="visible">已上架</option><option value="hidden">已隱藏</option></select></div>
    <div className="article-admin-table"><div className="article-admin-row article-admin-head"><span>服務名稱</span><span>價格</span><span>排序</span><span>狀態</span><span>操作</span></div>{[...values].sort((a,b) => a.sortOrder-b.sortOrder).filter((item) => `${item.name} ${item.summary}`.includes(keyword.trim()) && (status === 'all' || item.isVisible === (status === 'visible'))).map((item) => <div className="article-admin-row" key={item.id}><span><strong>{item.name}</strong><small>{item.summary}</small></span><span>{item.priceLabel || (item.price == null ? '洽詢' : `NT$ ${item.price.toLocaleString()}`)}</span><span>{item.sortOrder}</span><span><i className={item.isVisible ? 'status published' : 'status'}>{item.isVisible ? '已上架' : '已隱藏'}</i></span><span><button type="button" className="text-btn" aria-label={`編輯 ${item.name}`} onClick={() => selectService(item.id)}>編輯</button></span></div>)}</div>
    {values.length === 0 && <p className="empty">目前沒有服務，請新增服務。</p>}
  </section>;
  if (!current) return null;
  const warnings = serviceQualityWarnings(current);
  return <section className="panel form-panel article-edit-page article-full-panel"><div className="panel-heading article-edit-heading"><div><button type="button" className="back-btn" onClick={leave}>← 返回服務清單</button><div className="article-title-row"><h3>編輯服務</h3>{dirty && <span className="unsaved-indicator">尚未儲存</span>}</div>{notice && <span role="status" className="muted">{notice}</span>}</div><div className="editor-actions"><button type="button" className="save-btn" onClick={() => void save()}><Save size={15} />儲存</button><button type="button" className="secondary-btn" onClick={() => void remove()}><Trash2 size={15} />刪除服務</button></div></div>{warnings.length > 0 && <p className="form-notice seo-quality-warning" role="status">SEO 提醒：{warnings.join('、')}</p>}<FormField label="服務名稱" value={current.name} onChange={(value) => update('name', value)} /><label className="field"><span>網址代稱</span><input aria-label="服務網址代稱" maxLength={80} value={current.slug} onChange={(event) => update('slug', event.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder="例如：full-body" /><small className="muted">只能使用英文小寫、數字與連字號；修改後舊網址會自動轉址。</small></label><FormField label="卡片摘要" value={current.summary} onChange={(value) => update('summary', value)} /><FormField label="介紹內容" value={current.description} textarea onChange={(value) => update('description', value)} /><FormField label="服務流程（選填）" value={current.process || ''} textarea onChange={(value) => update('process', value)} /><FormField label="適用情境（選填）" value={current.suitableFor || ''} textarea onChange={(value) => update('suitableFor', value)} /><FormField label="注意事項（選填）" value={current.precautions || ''} textarea onChange={(value) => update('precautions', value)} /><FormField label="常見問題（選填）" value={current.faq || ''} textarea onChange={(value) => update('faq', value)} /><FormField label="SEO 標題（選填）" value={current.seoTitle || ''} onChange={(value) => update('seoTitle', value)} /><FormField label="SEO 描述（選填）" value={current.seoDescription || ''} textarea onChange={(value) => update('seoDescription', value)} /><div className="field cover-field"><div className="cover-field-heading"><span>服務圖片</span><button type="button" className="secondary-btn" onClick={() => setChoosingImage(true)}>選擇封面圖片</button></div>{current.imageUrl && <img className="selected-cover-preview" src={resolveMediaUrl(current.imageUrl, webOrigin)} alt={current.imageAlt || '目前服務圖片'} />}</div>{choosingImage && <CoverImagePicker media={media} value={current.imageUrl} webOrigin={webOrigin} onClose={() => setChoosingImage(false)} onSelect={(file) => { setValues(values.map((item) => item.id === current.id ? { ...item, imageUrl: file.url, imageAlt: file.alt || item.imageAlt } : item)); setDirty(true); setChoosingImage(false); }} />}<FormField label="圖片替代文字" value={current.imageAlt || ''} onChange={(value) => update('imageAlt', value)} /><label className="field"><span>卡片圖示</span><select value={current.icon} onChange={(event) => update('icon', event.target.value as Service['icon'])}><option value="lotus">蓮花</option><option value="oil">精油瓶</option><option value="stone">熱石</option><option value="foot">足部</option><option value="flower">花朵</option></select></label><div className="two-fields"><FormField label="療程分鐘" value={String(current.durationMinutes ?? '')} onChange={(value) => update('durationMinutes', value ? Number(value) : undefined)} /><FormField label="排序" value={String(current.sortOrder)} onChange={(value) => update('sortOrder', Number(value) || 0)} /></div><div className="two-fields"><FormField label="價格（空白為洽詢）" value={String(current.price ?? '')} onChange={(value) => update('price', value ? Number(value) : undefined)} /><FormField label="價格顯示文字" value={current.priceLabel ?? ''} onChange={(value) => update('priceLabel', value || undefined)} /></div><label className="check"><input type="checkbox" checked={current.isVisible} onChange={(event) => update('isVisible', event.target.checked)} /> 顯示於官網</label></section>;
}
function FormField({ label, value, onChange, textarea }: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean }) { if (label.includes('圖片網址')) return null; const readOnly = label.includes('系統代碼'); return <label className="field"><span>{label}</span>{textarea ? <textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} /> : <input value={value} readOnly={readOnly} onChange={(event) => onChange(event.target.value)} />}</label>; }

function PricingEditor({ values, setValues, media }: { values: PricingPlan[]; setValues: (values: PricingPlan[]) => void; media: AdminMedia[] }) {
  const [selectedId, setSelectedId] = useState(values[0]?.id || ''); const [editing, setEditing] = useState(false); const [dirty, setDirty] = useState(false); const [notice, setNotice] = useState(''); const current = values.find((item) => item.id === selectedId) || values[0];
  useUnsavedWarning(dirty, 'pricing');
  const update = (key: keyof PricingPlan, value: unknown) => { if (!current) return; setValues(values.map((item) => item.id === current.id ? { ...item, [key]: value } : item)); setDirty(true); };
  const save = async () => { if (!current) return; if (!current.name.trim() || !current.summary.trim() || current.price < 0 || (current.showOnHome && (!current.imageUrl || !current.imageAlt))) { setNotice('請填寫名稱、摘要、價格；首頁推薦需有圖片與替代文字'); return; } const result = await savePricingPlan(current); if (result.ok) { setValues(values.map((item) => item.id === current.id ? { ...item, id: 'id' in result && result.id ? result.id : item.id, version: result.version } : item)); setDirty(false); setNotice('價目已儲存，網站更新中'); } else setNotice(`儲存失敗：${result.error}`); };
  const add = () => { const next: PricingPlan = { id: `local-${Date.now()}`, name: '新價目方案', summary: '', description: '', category: '組合方案', price: 0, isVisible: false, showOnHome: false, isFeatured: false, sortOrder: values.length + 1, homeSortOrder: values.length + 1, imageUrl: '', imageAlt: '' }; setValues([...values, next]); setSelectedId(next.id); setEditing(true); setDirty(true); setNotice(''); };
  const remove = async () => { if (!current || !window.confirm(`確定刪除「${current.name}」？`)) return; const result = await deletePricingPlan(current.id); if (!result.ok) { setNotice(`刪除失敗：${result.error}`); return; } const remaining = values.filter((item) => item.id !== current.id); setValues(remaining); setSelectedId(remaining[0]?.id || ''); setEditing(false); setDirty(false); setNotice('價目已刪除'); };
  if (!editing) return <section className="panel article-list-page article-full-panel"><div className="panel-heading article-list-heading"><div><h3>價目表管理</h3><p className="muted">管理完整價目表，勾選「顯示於首頁」即可加入首頁推薦。</p></div><button type="button" className="small-btn" onClick={add}><Plus size={15}/>新增價目</button></div>{notice && <p role="status" className="form-notice">{notice}</p>}<div className="article-admin-table pricing-admin-table"><div className="article-admin-row article-admin-head"><span>方案名稱</span><span>價格</span><span>首頁</span><span>狀態</span><span>操作</span></div>{[...values].sort((a,b)=>a.sortOrder-b.sortOrder).map((item)=><div className="article-admin-row" key={item.id}><span><strong>{item.name}</strong><small>{item.category}・{item.durationMinutes ? `${item.durationMinutes} 分鐘` : item.durationNote || '時間待確認'}</small></span><span>NT$ {item.price.toLocaleString()}</span><span>{item.showOnHome ? '已顯示' : '—'}</span><span><i className={item.isVisible ? 'status published' : 'status'}>{item.isVisible ? '已上架' : '已隱藏'}</i></span><span><button type="button" className="text-btn" onClick={() => { setSelectedId(item.id); setEditing(true); setNotice(''); }}>編輯</button></span></div>)}</div></section>;
  if (!current) return null;
  const images = media.filter((file) => file.mimeType.startsWith('image/'));
  return <section className="panel form-panel article-edit-page article-full-panel"><div className="panel-heading article-edit-heading"><div><button type="button" className="back-btn" onClick={() => { if (!dirty || window.confirm('有尚未儲存的變更，確定返回嗎？')) { setEditing(false); setDirty(false); } }}>← 返回價目清單</button><div className="article-title-row"><h3>編輯價目</h3>{dirty && <span className="unsaved-indicator">尚未儲存</span>}</div>{notice && <span role="status" className="muted">{notice}</span>}</div><div className="editor-actions"><button type="button" className="save-btn" onClick={() => void save()}><Save size={15}/>儲存</button><button type="button" className="secondary-btn" onClick={() => void remove()}><Trash2 size={15}/>刪除</button></div></div><FormField label="方案名稱" value={current.name} onChange={(value) => update('name', value)}/><FormField label="卡片摘要" value={current.summary} onChange={(value) => update('summary', value)}/><FormField label="完整說明" value={current.description} textarea onChange={(value) => update('description', value)}/><label className="field"><span>價目分類</span><select value={current.category} onChange={(event) => update('category', event.target.value)}>{['局部舒壓','足部服務','全身與精油按摩','組合方案','刮痧與拔罐'].map((item)=><option key={item}>{item}</option>)}</select></label><div className="two-fields"><FormField label="分鐘數（可空白）" value={String(current.durationMinutes ?? '')} onChange={(value) => update('durationMinutes', value ? Number(value) : undefined)}/><FormField label="時間備註" value={current.durationNote || ''} onChange={(value) => update('durationNote', value)}/></div><div className="two-fields"><FormField label="價格" value={String(current.price)} onChange={(value) => update('price', Number(value) || 0)}/><FormField label="價目表排序" value={String(current.sortOrder)} onChange={(value) => update('sortOrder', Number(value) || 0)}/></div><div className="field"><span>首頁推薦圖片</span><div className="media-picker pricing-media-picker">{images.map((file)=><button type="button" key={file.id} className={current.imageUrl === file.url ? 'selected' : ''} onClick={() => { update('imageUrl', file.url); update('imageAlt', file.alt || current.name); }}><img src={resolveMediaUrl(file.url, webOrigin)} alt=""/><small>{file.name}</small></button>)}</div></div><FormField label="圖片替代文字" value={current.imageAlt || ''} onChange={(value) => update('imageAlt', value)}/><div className="two-fields"><FormField label="首頁排序" value={String(current.homeSortOrder)} onChange={(value) => update('homeSortOrder', Number(value) || 0)}/><label className="check"><input type="checkbox" checked={current.isFeatured} onChange={(event) => update('isFeatured', event.target.checked)}/> 熱門方案</label></div><label className="check"><input type="checkbox" checked={current.showOnHome} onChange={(event) => update('showOnHome', event.target.checked)}/> 顯示於首頁</label><label className="check"><input type="checkbox" checked={current.isVisible} onChange={(event) => update('isVisible', event.target.checked)}/> 上架於完整價目表</label></section>;
}


function MediaEditor({ values, setValues, loading }: { values: AdminMedia[]; setValues: (values: AdminMedia[]) => void; loading: boolean }) {
  const files = values; const setFiles = setValues; const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [keyword, setKeyword] = useState(''); const [mimeFilter, setMimeFilter] = useState<'all' | 'image' | 'video'>('all'); const [uploadProgress, setUploadProgress] = useState<MediaUploadProgressState | null>(null);
  const filteredFiles = files.filter((file) => (!keyword.trim() || `${file.name} ${file.alt}`.toLowerCase().includes(keyword.trim().toLowerCase())) && (mimeFilter === 'all' || file.mimeType.startsWith(`${mimeFilter}/`)));
  const addFile = async (file: File) => {
    if (uploadProgress) return;
    setError(''); setNotice(''); setUploadProgress({ fileName: file.name, loaded: 0, total: file.size, percent: 0, phase: 'uploading' });
    try {
      const result = await uploadMedia(file, '', (progress) => setUploadProgress({ fileName: file.name, ...progress }));
      if (result.ok) { const next: AdminMedia = { id: 'id' in result && result.id ? result.id : `local-${Date.now()}`, name: 'name' in result && result.name ? result.name : file.name, url: result.url, alt: '', mimeType: 'mimeType' in result && result.mimeType ? result.mimeType : file.type, size: 'size' in result && typeof result.size === 'number' ? result.size : file.size, storagePath: 'storagePath' in result ? result.storagePath : undefined, width: 'width' in result && typeof result.width === 'number' ? result.width : undefined, height: 'height' in result && typeof result.height === 'number' ? result.height : undefined }; setFiles([next, ...files]); setNotice(`素材「${file.name}」已上傳`); } else setError(result.error || '上傳失敗');
    } finally { setUploadProgress(null); }
  };
  const updateAlt = async (file: AdminMedia, alt: string) => { const normalizedAlt = alt.trim().slice(0, 160); setError(''); setFiles(files.map((item) => item.id === file.id ? { ...item, alt: normalizedAlt } : item)); if (adminRemoteEnabled && !file.id.startsWith('local-')) { const result = await saveMediaAlt(file.id, normalizedAlt); if (!result.ok) { setError(`替代文字儲存失敗：${result.error}`); return; } } setNotice('替代文字已儲存'); };
  const remove = async (file: AdminMedia) => { if (!window.confirm(`確定刪除「${file.name}」？正在使用的素材會由資料庫拒絕刪除。`)) return; const result = await deleteMedia(file); if (!result.ok) { setError(`刪除失敗：${'error' in result ? String(result.error) : '素材刪除失敗'}`); return; } setFiles(files.filter((item) => item.id !== file.id)); setNotice('素材已刪除'); };
  return <div className="panel"><div className="panel-heading"><div><h3>素材管理</h3><p className="muted">圖片支援 JPEG／PNG／WebP（10 MB）；影片支援 MP4／WebM／MOV（25 MB） {loading ? '・載入中…' : ''}</p>{notice && <span className="muted">{notice}</span>}</div><label className="small-btn" aria-busy={Boolean(uploadProgress)}><Plus size={15} />{uploadProgress ? `上傳中 ${uploadProgress.percent}%` : '上傳素材'}<input hidden disabled={Boolean(uploadProgress)} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,.mp4,.m4v,.webm,.mov" onChange={(event) => { const file = event.target.files?.[0]; if (file) void addFile(file); event.currentTarget.value = ''; }} /></label></div><MediaUploadProgress value={uploadProgress} /><div className="media-filters"><input aria-label="搜尋素材" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜尋檔名或替代文字" /><select aria-label="素材格式" value={mimeFilter} onChange={(event) => setMimeFilter(event.target.value as typeof mimeFilter)}><option value="all">全部格式</option><option value="image">圖片</option><option value="video">影片</option></select></div>{error && <p className="error">{error}</p>}<div className="media-grid">{filteredFiles.map((file) => <div className="media-card" key={file.id}>{file.mimeType.startsWith('video/') ? <video src={resolveMediaUrl(file.url, webOrigin)} controls preload="metadata" /> : <img src={resolveMediaUrl(file.url, webOrigin)} alt={file.alt} />}<strong>{file.name}</strong><small className="media-dimensions">{file.width && file.height ? `${file.width} × ${file.height}px` : file.mimeType.startsWith('video/') ? '影片' : '尺寸待讀取'}　{Math.round(file.size / 1024)} KB</small><input aria-label={`${file.name} 替代文字`} defaultValue={file.alt} onBlur={(event) => void updateAlt(file, event.target.value)} placeholder={file.mimeType.startsWith('video/') ? '影片說明' : '替代文字'} /><button className="text-btn" onClick={(event) => { const input = event.currentTarget.previousElementSibling as HTMLInputElement | null; if (input) void updateAlt(file, input.value); }}>儲存說明</button><button className="danger media-delete" type="button" onClick={() => void remove(file)}>刪除素材</button></div>)}</div>{filteredFiles.length === 0 && <p className="empty">沒有符合條件的素材。</p>}</div>;
}

function MessagesEditor({ values, setValues }: { values: AdminMessage[]; setValues: (values: AdminMessage[]) => void }) {
  const [selectedId, setSelectedId] = useState(values[0]?.id); const [filter, setFilter] = useState<'all' | 'unread' | 'handled'>('all'); const [page, setPage] = useState(1); const [notice, setNotice] = useState(''); const [dirty, setDirty] = useState(false); const [action, setAction] = useState<'handle' | 'note' | 'delete' | null>(null);
  const filtered = values.filter((item) => filter === 'all' || item.status === filter); const pageSize = 8; const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize)); const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize); const selected = pageItems.find((item) => item.id === selectedId) || pageItems[0];
  useEffect(() => { if (page > totalPages) setPage(totalPages); if (!selected && pageItems[0]) setSelectedId(pageItems[0].id); }, [page, totalPages, selected, pageItems]);
  useUnsavedWarning(dirty, 'messages');
  const selectMessage = (id: string) => { if (id === selectedId) return; if (dirty && !window.confirm('有尚未儲存的留言備註，確定要切換嗎？')) return; setSelectedId(id); setDirty(false); setNotice(''); };
  const markHandled = async () => { if (!selected || action) return; const next = { ...selected, status: 'handled' as const }; setAction('handle'); const result = await saveMessage(next); if (result.ok) { setValues(values.map((item) => item.id === selected.id ? next : item)); setDirty(false); } setNotice(result.ok ? '留言已標記處理' : `儲存失敗：${result.error}`); setAction(null); };
  const saveNote = async () => { if (!selected || action) return; setAction('note'); const result = await saveMessage(selected); if (result.ok) setDirty(false); setNotice(result.ok ? '內部備註已儲存' : `儲存失敗：${result.error}`); setAction(null); };
  const remove = async () => { if (!selected || action || !confirm(`確定刪除「${selected.name}」的留言？`)) return; setAction('delete'); const result = await deleteMessage(selected.id); if (!result.ok) { setNotice(`刪除失敗：${result.error}`); setAction(null); return; } const remaining = values.filter((item) => item.id !== selected.id); setValues(remaining); setSelectedId(remaining[0]?.id); setDirty(false); setNotice('留言已刪除'); setAction(null); };
  const updateNote = (note: string) => { if (!selected) return; setValues(values.map((item) => item.id === selected.id ? { ...item, note } : item)); setDirty(true); };
  return <div className="editor-layout messages-editor"><div className="panel list-panel"><div className="panel-heading"><div><h3>聯絡留言</h3><span className="count">{values.filter((item) => item.status === 'unread').length} 未處理</span></div><div className="tabs"><button className={filter === 'all' ? 'active' : ''} onClick={() => { setFilter('all'); setPage(1); }}>全部</button><button className={filter === 'unread' ? 'active' : ''} onClick={() => { setFilter('unread'); setPage(1); }}>未處理</button><button className={filter === 'handled' ? 'active' : ''} onClick={() => { setFilter('handled'); setPage(1); }}>已處理</button></div></div>{pageItems.length === 0 && <p className="empty">目前沒有留言</p>}{pageItems.map((item) => <button className={item.id === selected?.id ? 'list-item selected' : 'list-item'} key={item.id} onClick={() => selectMessage(item.id)}><span>{item.name}</span><small>{item.status === 'unread' ? '未處理' : '已處理'}</small></button>)}{totalPages > 1 && <div className="admin-pagination"><button disabled={page === 1} onClick={() => setPage(page - 1)}>上一頁</button><span>{page} / {totalPages}</span><button disabled={page === totalPages} onClick={() => setPage(page + 1)}>下一頁</button></div>}</div>{selected && <div className="panel form-panel"><div className="panel-heading"><div><h3>{selected.name} 的留言 {dirty && <span className="unsaved-indicator">尚未儲存</span>}</h3>{notice && <span className="muted" aria-live="polite">{notice}</span>}</div><div className="message-actions"><button className="save-btn" disabled={action !== null} onClick={() => void markHandled()}><Save size={15} />{action === 'handle' ? '處理中…' : '標記已處理'}</button><button className="secondary-btn" disabled={action !== null} onClick={() => void saveNote()}><Save size={15} />{action === 'note' ? '儲存中…' : '儲存備註'}</button><button className="danger" disabled={action !== null} onClick={() => void remove()}><Trash2 size={15} />{action === 'delete' ? '刪除中…' : '刪除留言'}</button></div></div><p><b>電話：</b>{selected.phone}</p><p><b>Email：</b>{selected.email || '未提供'}</p><p><b>時間：</b>{new Date(selected.createdAt).toLocaleString('zh-TW')}</p><p className="message-body">{selected.message}</p><FormField label="內部備註" value={selected.note || ''} onChange={updateNote} /><p className="muted">備註可單獨儲存，也會在標記處理時一併保存。</p></div>}</div>;
}

function SettingsEditor({ value, setValue, loading, media }: { value: AdminSettings; setValue: (value: AdminSettings) => void; loading: boolean; media: AdminMedia[] }) {
  const [notice, setNotice] = useState(''); const [dirty, setDirty] = useState(false); const [saving, setSaving] = useState(false); const normalized = normalizeAdminSettings(value);
  useUnsavedWarning(dirty, 'settings');
  const update = (key: keyof typeof normalized, next: string) => { setValue({ ...normalized, [key]: next }); setDirty(true); };
  const save = async () => {
    setNotice('');
    const validationError = validateSettingsFields(normalized);
    if (validationError) { setNotice(validationError); return; }
    setSaving(true);
    try {
      const result = await saveSettings(normalized);
      if (result.ok) { setValue({ ...normalized, ...(result.version ? { version: result.version } : {}) }); setDirty(false); }
      setNotice(result.ok ? '網站設定已儲存，官網正在重新發布' : `儲存失敗：${result.error}`);
    } catch { setNotice('儲存失敗：設定資料格式不正確，請重新整理後再試'); }
    finally { setSaving(false); }
  };
  return <div className="panel form-panel narrow"><div className="panel-heading"><div><h3>網站基本設定</h3><p className="muted" aria-live="polite">{loading ? '載入中…' : adminRemoteEnabled ? '儲存後刷新官網即可看到更新' : '開發模式儲存在此瀏覽器；設定伺服器 API 後才會同步官網'} {dirty && <span className="unsaved-indicator">尚未儲存</span>} {notice && `・${notice}`}</p></div><button type="button" className="save-btn" disabled={saving} onClick={() => void save()}><Save size={15} />{saving ? '儲存中…' : '儲存'}</button></div><FormField label="品牌名稱" value={normalized.brandName} onChange={(next) => update('brandName', next)} /><FormField label="Logo 圖片網址" value={normalized.logoUrl} onChange={(next) => update('logoUrl', next)} /><MediaPicker value={normalized.logoUrl} onChange={(asset) => update('logoUrl', asset.url)} files={media} /><FormField label="聯絡電話" value={normalized.phone} onChange={(next) => update('phone', next)} /><FormField label="LINE ID" value={normalized.line} onChange={(next) => update('line', next)} /><FormField label="地址" value={normalized.address} onChange={(next) => update('address', next)} /><FormField label="營業時間" value={normalized.hours} onChange={(next) => update('hours', next)} /><FormField label="地圖 Embed URL" value={normalized.mapEmbedUrl} onChange={(next) => update('mapEmbedUrl', next)} /><div className="two-fields"><FormField label="Instagram URL" value={normalized.instagram} onChange={(next) => update('instagram', next)} /><FormField label="Facebook URL" value={normalized.facebook} onChange={(next) => update('facebook', next)} /></div><FormField label="YouTube URL" value={normalized.youtube} onChange={(next) => update('youtube', next)} /><FormField label="SEO 標題" value={normalized.seoTitle} onChange={(next) => update('seoTitle', next)} /><FormField label="SEO 描述" value={normalized.seoDescription} textarea onChange={(next) => update('seoDescription', next)} /><FormField label="分享圖片網址" value={normalized.ogImageUrl} onChange={(next) => update('ogImageUrl', next)} /><MediaPicker value={normalized.ogImageUrl} onChange={(asset) => update('ogImageUrl', asset.url)} files={media} /><FormField label="編輯團隊名稱" value={normalized.editorialTeamName} onChange={(next) => update('editorialTeamName', next)} /><FormField label="編輯團隊介紹" value={normalized.editorialBio} textarea onChange={(next) => update('editorialBio', next)} /><FormField label="編輯政策" value={normalized.editorialPolicy} textarea onChange={(next) => update('editorialPolicy', next)} /><FormField label="隱私權政策" value={normalized.privacy} textarea onChange={(next) => update('privacy', next)} /><FormField label="服務條款" value={normalized.terms} textarea onChange={(next) => update('terms', next)} /></div>;
}

function HomeContentEditor({ value, setValue, media }: { value: AdminSettings; setValue: (value: AdminSettings) => void; media: AdminMedia[] }) {
  const [notice, setNotice] = useState('');
  const [dirty, setDirty] = useState(false);
  const normalized = normalizeAdminSettings(value);
  useUnsavedWarning(dirty, 'home-content');
  type TextKey = Exclude<keyof typeof seedSettings, 'benefits' | 'pricingBenefits'>;
  const update = (key: TextKey, next: string) => { setValue({ ...normalized, [key]: next }); setDirty(true); };
  const save = async () => {
    const validationError = validateSettingsFields(normalized);
    if (validationError) { setNotice(validationError); return; }
    const result = await saveSettings(normalized);
    if (result.ok) { setValue({ ...normalized, ...(result.version ? { version: result.version } : {}) }); setDirty(false); }
    setNotice(result.ok ? '首頁區塊已儲存' : `儲存失敗：${result.error}`);
  };
  return <div className="panel form-panel home-content-editor">
    <div className="panel-heading"><div><h3>首頁區塊設定</h3><p className="muted">{dirty && <span className="unsaved-indicator">尚未儲存</span>}{notice && `・${notice}`}</p></div><button type="button" className="save-btn" onClick={() => void save()}><Save size={15} />儲存</button></div>
    <div className="home-editor-section"><h4>主視覺</h4><div className="two-fields"><FormField label="主標題" value={normalized.heroTitle} onChange={(next) => update('heroTitle', next)} /><FormField label="副標題" value={normalized.heroSubtitle} onChange={(next) => update('heroSubtitle', next)} /></div><FormField label="標語" value={normalized.tagline} onChange={(next) => update('tagline', next)} /><FormField label="說明文字" value={normalized.heroDescription} onChange={(next) => update('heroDescription', next)} /><FormField label="背景圖片網址" value={normalized.heroBackgroundUrl} onChange={(next) => update('heroBackgroundUrl', next)} /><MediaPicker value={normalized.heroBackgroundUrl} onChange={(asset) => update('heroBackgroundUrl', asset.url)} files={media} /></div>
    <div className="home-editor-section"><h4>服務與價格</h4><div className="two-fields"><FormField label="服務標題" value={normalized.servicesTitle} onChange={(next) => update('servicesTitle', next)} /><FormField label="服務副標題" value={normalized.servicesSubtitle} onChange={(next) => update('servicesSubtitle', next)} /></div><FormField label="服務說明" value={normalized.servicesNote} textarea onChange={(next) => update('servicesNote', next)} /><FormField label="服務區背景圖片網址" value={normalized.servicesBackgroundUrl} onChange={(next) => update('servicesBackgroundUrl', next)} /><MediaPicker value={normalized.servicesBackgroundUrl} onChange={(asset) => update('servicesBackgroundUrl', asset.url)} files={media} /><div className="two-fields"><FormField label="價格標題" value={normalized.pricingTitle} onChange={(next) => update('pricingTitle', next)} /><FormField label="價格副標題" value={normalized.pricingSubtitle} onChange={(next) => update('pricingSubtitle', next)} /></div><FormField label="價格區背景圖片網址" value={normalized.pricingBackgroundUrl} onChange={(next) => update('pricingBackgroundUrl', next)} /><MediaPicker value={normalized.pricingBackgroundUrl} onChange={(asset) => update('pricingBackgroundUrl', asset.url)} files={media} /></div>
    <div className="home-editor-section"><h4>消息與部落格</h4><div className="two-fields"><FormField label="消息標題" value={normalized.newsTitle} onChange={(next) => update('newsTitle', next)} /><FormField label="消息副標題" value={normalized.newsSubtitle} onChange={(next) => update('newsSubtitle', next)} /></div><FormField label="消息區背景圖片網址" value={normalized.newsBackgroundUrl} onChange={(next) => update('newsBackgroundUrl', next)} /><MediaPicker value={normalized.newsBackgroundUrl} onChange={(asset) => update('newsBackgroundUrl', asset.url)} files={media} /><div className="two-fields"><FormField label="部落格標題" value={normalized.blogTitle} onChange={(next) => update('blogTitle', next)} /><FormField label="部落格副標題" value={normalized.blogSubtitle} onChange={(next) => update('blogSubtitle', next)} /></div><FormField label="部落格區背景圖片網址" value={normalized.blogBackgroundUrl} onChange={(next) => update('blogBackgroundUrl', next)} /><MediaPicker value={normalized.blogBackgroundUrl} onChange={(asset) => update('blogBackgroundUrl', asset.url)} files={media} /></div>
    <div className="home-editor-section"><h4>聯繫區</h4><div className="two-fields"><FormField label="聯繫標題" value={normalized.contactTitle} onChange={(next) => update('contactTitle', next)} /><FormField label="聯繫副標題" value={normalized.contactLead} onChange={(next) => update('contactLead', next)} /></div><FormField label="聯繫區背景圖片網址" value={normalized.contactBackgroundUrl} onChange={(next) => update('contactBackgroundUrl', next)} /><MediaPicker value={normalized.contactBackgroundUrl} onChange={(asset) => update('contactBackgroundUrl', asset.url)} files={media} /></div>
  </div>;
}

type AdminWindow = Window & { __tianXingeAdminRoot?: Root };
const adminWindow = window as AdminWindow;
const adminRoot = adminWindow.__tianXingeAdminRoot ?? createRoot(document.getElementById('root')!);
adminWindow.__tianXingeAdminRoot = adminRoot;
adminRoot.render(<BrowserRouter><App /></BrowserRouter>);
