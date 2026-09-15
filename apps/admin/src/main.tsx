import React, { useEffect, useMemo, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Image as ImageIcon, Settings, Sparkles, Newspaper, Mail, Menu, Save, Plus, Trash2, ExternalLink } from 'lucide-react';
import { createContentCode, fixtureArticles, fixtureCategories, fixtureMedia, fixtureMessages, fixtureServices, fixtureSettings, isContentCode, isSafeContentUrl, isValidBenefits, type Service } from '@tian-xin-ge/contracts';
import './styles.css';
import { ArticleManagement } from './features/articles/ArticleManagement';
import { resolveMediaUrl } from './lib/media-url';
import { restoreServerSession, signInWithServerAccount, signOutServerAccount } from './features/auth/infrastructure/serverAccountClient';
import { isServerAdminApiEnabled } from './features/auth/infrastructure/adminApi';
import { deleteMedia, deleteMessage, deleteService, loadArticles, loadCategories, loadMedia, loadMessages, loadServices, loadSettings, saveMediaAlt, saveMessage, saveService, saveSettings, uploadMedia, type AdminCategory, type ManagedArticle, type AdminMessage, type AdminMedia } from './repositories';

const webOrigin = (import.meta.env.VITE_WEB_URL || 'http://localhost:3000').replace(/\/+$/, '');
const serverAuthEnabled = isServerAdminApiEnabled();
const adminRemoteEnabled = serverAuthEnabled;
const stableContentCode = (seed: string) => { let hash = 2166136261; for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619); const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'; let value = hash >>> 0; return Array.from({ length: 10 }, () => { value = Math.imul(value ^ (value >>> 13), 16777619) >>> 0; return alphabet[value % alphabet.length]; }).join(''); };
const seedServices: Service[] = fixtureServices.map((service) => ({ ...service, slug: stableContentCode(`service:${service.id}`) }));
const seedArticles: ManagedArticle[] = fixtureArticles.map((article) => ({ ...article, id: `local-${article.id}`, slug: stableContentCode(`article:${article.id}`), body: JSON.stringify(article.body) }));
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
};

function useStored<T>(key: string, initial: T, loader?: () => Promise<T | null>) {
  const [value, setValue] = useState<T>(() => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : initial; } catch { return initial; } });
  const [loading, setLoading] = useState(Boolean(loader && adminRemoteEnabled));
  const [loadError, setLoadError] = useState(false);
  useEffect(() => { if (!loader || !adminRemoteEnabled) return; setLoadError(false); void loader().then((remote) => { if (remote !== null) setValue(remote); else setLoadError(true); }).catch(() => setLoadError(true)).finally(() => setLoading(false)); }, [loader]);
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)); }, [key, value]);
  return [value, setValue, loading, loadError] as const;
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
  const logout = async () => { if (serverAuthEnabled) await signOutServerAccount(); sessionStorage.removeItem('tian-admin'); setLogged(false); };
  return logged ? <Dashboard onLogout={logout} /> : <Login notice={authNotice} onLogin={() => { sessionStorage.setItem('tian-admin', '1'); setAuthNotice(''); setLogged(true); }} />;
}

function Login({ onLogin, notice }: { onLogin: () => void; notice?: string }) {
  const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(''); setMessage(''); if (!username.trim() || !password) { setError('請輸入管理員帳號與密碼'); return; } setBusy(true); if (serverAuthEnabled) { const result = await signInWithServerAccount(username, password); if (!result.ok) { const messages: Record<string, string> = { invalid: '帳號或密碼不正確', rate_limited: '登入嘗試次數過多，請稍後再試', origin_denied: '請從後台網站登入', unavailable: '目前無法驗證登入服務，請稍後再試', network: '目前無法連線登入服務，請稍後再試' }; setError(messages[result.reason]); setBusy(false); return; } onLogin(); setBusy(false); return; } if (import.meta.env.PROD || username.trim().toLowerCase() !== 'tiancinge') { setError(import.meta.env.PROD ? '正式環境必須啟用伺服器登入服務' : '帳號或密碼不正確'); setBusy(false); return; } onLogin(); setBusy(false); };
  const reset = () => { setError(''); setMessage('請聯絡網站維護者重設管理員密碼。'); };
  return <div className="login-page"><div className="login-card"><img src={`${webOrigin}/assets/logo/logo_1_去背.png`} alt="天心閣" /><p>天心閣養生會館</p><h1>內容管理後台</h1>{notice && <p className="auth-notice" role="status">{notice}</p>}<form onSubmit={submit}><label>管理員帳號<input value={username} onChange={(e) => setUsername(e.target.value)} type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="請輸入帳號" /></label><label>密碼<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" placeholder="••••••••" /></label>{error && <small className="error" role="alert">{error}</small>}{message && <small className="muted" role="status">{message}</small>}<button className="primary" disabled={busy}>{busy ? '登入中…' : '登入後台'}</button><button type="button" className="text-btn" onClick={reset}>需要重設密碼？</button></form><small>{serverAuthEnabled ? '登入由網站伺服器驗證，資料操作使用安全 session' : '僅限本機開發模式使用測試登入'}</small></div></div>;
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const location = useLocation(); const navigate = useNavigate(); const [collapsed, setCollapsed] = useState(false); const active = ({ '/': 'overview', '/services': 'services', '/articles': 'articles', '/news': 'news', '/blog': 'blog', '/media': 'media', '/messages': 'messages', '/settings': 'settings' } as Record<string, string>)[location.pathname] || 'overview'; const go = (id: string) => { if (hasUnsavedChanges() && !window.confirm('有尚未儲存的變更，確定要離開嗎？')) return; navigate(id === 'overview' ? '/' : `/${id}`); };
  const [services, setServices, servicesLoading, servicesError] = useStored('txg-services', seedServices, loadServices);
  const [messages, setMessages, messagesLoading, messagesError] = useStored<AdminMessage[]>('txg-messages', seedMessages, loadMessages);
  const [settings, setSettings, settingsLoading, settingsError] = useStored('txg-settings', seedSettings, loadSettings);
  const [articles, setArticles, articlesLoading, articlesError] = useStored<ManagedArticle[]>('txg-articles', seedArticles, loadArticles);
  const [categories, setCategories, categoriesLoading, categoriesError] = useStored<AdminCategory[]>('txg-categories', seedCategories, loadCategories);
  const [media, setMedia, mediaLoading, mediaError] = useStored<AdminMedia[]>('txg-media', seedMedia, loadMedia);
  const remoteLoading = Boolean(adminRemoteEnabled && (servicesLoading || messagesLoading || settingsLoading || articlesLoading || categoriesLoading || mediaLoading));
  const remoteLoadError = servicesError || messagesError || settingsError || articlesError || categoriesError || mediaError;
  const labels: Record<string, string> = { overview: '總覽', services: '服務價格', articles: '文章管理', news: '最新消息', blog: '部落格', media: '素材管理', messages: '聯絡留言', settings: '網站設定' };
  const setArticleDirty = React.useCallback((dirty: boolean) => { if (dirty) unsavedForms.add('articles'); else unsavedForms.delete('articles'); }, []);
  const logout = () => { if (hasUnsavedChanges() && !window.confirm('有尚未儲存的變更，確定要登出嗎？')) return; onLogout(); };
  return <div className={collapsed ? 'admin-shell collapsed' : 'admin-shell'}><aside><div className="admin-brand"><img src={`${webOrigin}/assets/logo/logo_1_去背.png`} alt="" /><span>天心閣<small>管理後台</small></span></div><nav><Nav icon={<LayoutDashboard />} label="總覽" id="overview" active={active} set={go} /><Nav icon={<Sparkles />} label="服務價格" id="services" active={active} set={go} /><Nav icon={<Newspaper />} label="最新消息" id="news" active={active} set={go} /><Nav icon={<Newspaper />} label="部落格" id="blog" active={active} set={go} /><Nav icon={<ImageIcon />} label="素材管理" id="media" active={active} set={go} /><Nav icon={<Mail />} label="聯絡留言" id="messages" active={active} set={go} /><Nav icon={<Settings />} label="網站設定" id="settings" active={active} set={go} /></nav><button className="logout" onClick={logout}><LogOut />登出</button></aside><section className="admin-main"><header><button className="icon-btn" aria-label={collapsed ? '展開選單' : '收合選單'} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}><Menu /></button><div><h1>{labels[active]}</h1><small>天心閣養生會館 / 管理後台</small></div><a href={webOrigin} target="_blank" rel="noreferrer" className="view-site">查看網站 <ExternalLink size={15} /></a></header><div className="admin-content" aria-busy={remoteLoading}>{remoteLoading ? <div className="loading-overlay" role="status">正在載入伺服器正式資料…</div> : <>{remoteLoadError && <div className="error-banner" role="alert">正式資料讀取失敗，目前顯示本機快照；請檢查網站伺服器連線後重新整理。</div>}{active === 'overview' && <Overview services={services} messages={messages} articles={articles} mediaCount={media.length} loading={servicesLoading || messagesLoading} />} {active === 'services' && <ServicesEditor values={services} setValues={setServices} media={media} />} {(active === 'articles' || active === 'news' || active === 'blog') && <ArticleManagement type={active === 'blog' ? 'blog' : 'news'} values={articles} setValues={setArticles} loading={articlesLoading} media={media} setMedia={setMedia} categories={categories} setCategories={setCategories} categoriesLoading={categoriesLoading} webOrigin={webOrigin} remoteEnabled={adminRemoteEnabled} onDirtyChange={setArticleDirty} />} {active === 'media' && <MediaEditor values={media} setValues={setMedia} loading={mediaLoading} />} {active === 'messages' && <MessagesEditor values={messages} setValues={setMessages} />} {active === 'settings' && <><SettingsEditor value={settings} setValue={setSettings} loading={settingsLoading} media={media} /><HomeContentEditor value={settings} setValue={setSettings} media={media} /></>}</>}</div></section></div>;
}
function Nav({ icon, label, id, active, set }: { icon: React.ReactNode; label: string; id: string; active: string; set: (id: string) => void }) { return <button className={active === id ? 'side-nav active' : 'side-nav'} aria-current={active === id ? 'page' : undefined} aria-label={label} onClick={() => set(id)}>{icon}<span>{label}</span></button>; }
function Overview({ services, messages, articles, mediaCount, loading }: { services: Service[]; messages: AdminMessage[]; articles: ManagedArticle[]; mediaCount: number; loading: boolean }) { return <div><div className="welcome"><div><span className="eyebrow">WELCOME BACK</span><h2>今天也一起讓生活更美好</h2><p>從這裡管理網站內容，儲存後重新整理官網即可看見更新。</p></div><a className="primary" href={webOrigin} target="_blank" rel="noreferrer">前往官網 <ExternalLink size={15} /></a></div><div className="stats"><Stat label="上架服務" value={services.filter((s) => s.isVisible).length} /><Stat label="文章總數" value={articles.length} /><Stat label="未處理留言" value={messages.filter((m) => m.status === 'unread').length} /><Stat label="素材數量" value={mediaCount} /></div><div className="panel quick"><h3>快速操作</h3><p>{loading ? '正在載入資料…' : '使用左側選單編輯固定版型內容，所有表單都有儲存前驗證。'}</p><div><span>✓　公開頁面資料與後台分離</span><span>✓　草稿不會出現在官網</span><span>✓　圖片上限 10 MB</span></div></div></div>; }
function Stat({ label, value }: { label: string; value: string | number }) { return <div className="stat"><small>{label}</small><strong>{value}</strong><span>管理內容　→</span></div>; }

function MediaPicker({ value, onChange, files }: { value: string; onChange: (asset: Pick<AdminMedia, 'id' | 'url' | 'alt'>) => void; files: AdminMedia[] }) {
  return <div className="media-picker"><span>快速選擇素材</span><div>{files.map((file) => <button type="button" key={file.id} className={file.url === value ? 'selected' : ''} aria-label={`選擇 ${file.name}`} aria-pressed={file.url === value} onClick={() => onChange(file)}><img src={resolveMediaUrl(file.url, webOrigin)} alt={file.alt || ''} /><small>{file.name}</small></button>)}</div>{files.length === 0 && <small className="muted">請先至素材管理上傳圖片</small>}</div>;
}

function validateService(service: Service, values: Service[]): string | null {
  if (!service.name.trim() || !service.slug.trim()) return '服務名稱與系統代碼為必填';
  if (!isContentCode(service.slug.trim())) return '系統代碼必須是 10 位小寫英數亂碼';
  if (values.some((item) => item.id !== service.id && item.slug.trim().toLowerCase() === service.slug.trim().toLowerCase())) return 'slug 不可重複';
  if (service.name.length > 120 || service.summary.length > 240 || service.description.length > 2000) return '名稱最多 120 字、摘要 240 字、介紹 2000 字';
  if (!isSafeContentUrl(service.imageUrl, true)) return '圖片網址必須是 https:// 或網站內部路徑';
  if (service.durationMinutes !== undefined && (!Number.isInteger(service.durationMinutes) || service.durationMinutes < 0 || service.durationMinutes > 1440)) return '療程分鐘必須介於 0 到 1440';
  if (service.price !== undefined && (!Number.isInteger(service.price) || service.price < 0 || service.price > 10_000_000)) return '價格必須是有效的非負整數';
  if (service.priceLabel && service.price !== undefined) return '固定價格與洽詢文字不可同時設定';
  if (service.priceLabel && service.priceLabel.length > 80) return '價格顯示文字最多 80 字';
  return null;
}

function validateSettingsFields(value: typeof seedSettings): string | null {
  if (!value.brandName.trim() || !value.phone.trim() || !value.line.trim() || !value.address.trim() || !value.hours.trim()) return '品牌、電話、LINE、地址與營業時間為必填';
  if (value.brandName.length > 120 || value.phone.length > 40 || value.line.length > 120 || value.address.length > 240 || value.hours.length > 120) return '品牌或聯絡資料超過欄位長度限制';
  if (value.mapEmbedUrl && !/^https:\/\/[^\s]+$/i.test(value.mapEmbedUrl.trim())) return '地圖 Embed URL 必須使用有效的 https:// 網址';
  if (!/^https:\/\/[^\s]+$/i.test(value.line.trim()) && !/^@?[A-Za-z0-9._-]{1,120}$/.test(value.line.trim())) return 'LINE 請輸入 ID 或有效的 https:// 連結';
  return null;
}

function ServicesEditor({ values, setValues, media }: { values: Service[]; setValues: (values: Service[]) => void; media: AdminMedia[] }) {
  const [selectedId, setSelectedId] = useState(values[0]?.id); const [notice, setNotice] = useState(''); const [dirty, setDirty] = useState(false); const current = values.find((item) => item.id === selectedId) || values[0];
  useUnsavedWarning(dirty, 'services');
  const selectService = (id: string) => { if (id === selectedId) return; if (dirty && !window.confirm('有尚未儲存的服務變更，確定要切換嗎？')) return; setSelectedId(id); setDirty(false); setNotice(''); };
  const update = (key: keyof Service, value: unknown) => { if (!current) return; setValues(values.map((item) => item.id === current.id ? { ...item, [key]: value } : item)); setDirty(true); };
  const save = async () => { if (!current) return; const validationError = validateService(current, values); if (validationError) { setNotice(validationError); return; } const result = await saveService(current); if (result.ok && 'id' in result && result.id && result.id !== current.id) { setValues(values.map((item) => item.id === current.id ? { ...current, id: result.id } : item)); setSelectedId(result.id); } if (result.ok) setDirty(false); setNotice(result.ok ? '服務已儲存' : `儲存失敗：${result.error}`); };
  const add = () => { const id = `local-${Date.now()}`; const next: Service = { id, slug: createContentCode(), name: '新服務項目', summary: '', description: '', imageUrl: adminRemoteEnabled ? '' : '/assets/crops/service-1.png', icon: 'lotus', sortOrder: values.length + 1, isVisible: false }; setValues([...values, next]); setSelectedId(id); setDirty(true); };
  const remove = async () => { if (!current || !confirm('確定刪除此項目？')) return; const result = await deleteService(current.id); if (!result.ok) { setNotice(`刪除失敗：${result.error}`); return; } const remaining = values.filter((item) => item.id !== current.id); setValues(remaining); setSelectedId(remaining[0]?.id || ''); setDirty(false); setNotice('服務已刪除'); };
  return <div className="editor-layout"><div className="panel list-panel"><div className="panel-heading"><h3>服務項目</h3><button type="button" className="small-btn" onClick={add}><Plus size={15} />新增</button></div>{[...values].sort((a, b) => a.sortOrder - b.sortOrder).map((item) => <button type="button" key={item.id} className={item.id === current?.id ? 'list-item selected' : 'list-item'} onClick={() => selectService(item.id)}><span>{item.name}</span><small>{item.isVisible ? '已上架' : '已隱藏'}</small></button>)}</div>{current && <div className="panel form-panel"><div className="panel-heading"><div><h3>編輯服務</h3>{dirty && <span className="unsaved-indicator">尚未儲存</span>}{notice && <span className="muted">{notice}</span>}</div><button type="button" className="save-btn" onClick={() => void save()}><Save size={15} />儲存</button></div><FormField label="服務名稱" value={current.name} onChange={(value) => update('name', value)} /><FormField label="系統代碼（10 位亂碼，不可修改）" value={current.slug} onChange={() => undefined} /><FormField label="卡片摘要" value={current.summary} onChange={(value) => update('summary', value)} /><FormField label="介紹內容" value={current.description} textarea onChange={(value) => update('description', value)} /><MediaPicker value={current.imageUrl} onChange={(asset) => update('imageUrl', asset.url)} files={media} /><label className="field"><span>卡片圖示</span><select value={current.icon} onChange={(event) => update('icon', event.target.value as Service['icon'])}><option value="lotus">蓮花</option><option value="oil">精油瓶</option><option value="stone">熱石</option><option value="foot">足部</option><option value="flower">花朵</option></select></label><div className="two-fields"><FormField label="療程分鐘" value={String(current.durationMinutes ?? '')} onChange={(value) => update('durationMinutes', value ? Number(value) : undefined)} /><FormField label="排序" value={String(current.sortOrder)} onChange={(value) => update('sortOrder', Number(value) || 0)} /></div><div className="two-fields"><FormField label="價格（空白為洽詢）" value={String(current.price ?? '')} onChange={(value) => update('price', value ? Number(value) : undefined)} /><FormField label="價格顯示文字" value={current.priceLabel ?? ''} onChange={(value) => update('priceLabel', value || undefined)} /></div><label className="check"><input type="checkbox" checked={current.isVisible} onChange={(event) => update('isVisible', event.target.checked)} /> 顯示於官網</label><button type="button" className="danger" onClick={() => void remove()}><Trash2 size={15} />刪除項目</button></div>}</div>;
}
function FormField({ label, value, onChange, textarea }: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean }) { if (label.includes('圖片網址')) return null; const readOnly = label.includes('網址代稱') || label.includes('系統代碼'); return <label className="field"><span>{label}</span>{textarea ? <textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} /> : <input value={value} readOnly={readOnly} onChange={(event) => onChange(event.target.value)} />}</label>; }


function MediaEditor({ values, setValues, loading }: { values: AdminMedia[]; setValues: (values: AdminMedia[]) => void; loading: boolean }) {
  const files = values; const setFiles = setValues; const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [keyword, setKeyword] = useState(''); const [mimeFilter, setMimeFilter] = useState<'all' | 'image/jpeg' | 'image/png' | 'image/webp'>('all');
  const filteredFiles = files.filter((file) => (!keyword.trim() || `${file.name} ${file.alt}`.toLowerCase().includes(keyword.trim().toLowerCase())) && (mimeFilter === 'all' || file.mimeType === mimeFilter));
  const addFile = async (file: File) => { setError(''); const result = await uploadMedia(file); if (result.ok) { const next: AdminMedia = { id: 'id' in result && result.id ? result.id : `local-${Date.now()}`, name: file.name, url: result.url, alt: '', mimeType: file.type, size: file.size, width: 'width' in result && typeof result.width === 'number' ? result.width : undefined, height: 'height' in result && typeof result.height === 'number' ? result.height : undefined }; setFiles([next, ...files]); setNotice('素材已上傳'); } else setError(result.error || '上傳失敗'); };
  const updateAlt = async (file: AdminMedia, alt: string) => { const normalizedAlt = alt.trim().slice(0, 160); setError(''); setFiles(files.map((item) => item.id === file.id ? { ...item, alt: normalizedAlt } : item)); if (adminRemoteEnabled && !file.id.startsWith('local-')) { const result = await saveMediaAlt(file.id, normalizedAlt); if (!result.ok) { setError(`替代文字儲存失敗：${result.error}`); return; } } setNotice('替代文字已儲存'); };
  const remove = async (file: AdminMedia) => { if (!window.confirm(`確定刪除「${file.name}」？正在使用的素材會由資料庫拒絕刪除。`)) return; const result = await deleteMedia(file); if (!result.ok) { setError(`刪除失敗：${'error' in result ? String(result.error) : '素材刪除失敗'}`); return; } setFiles(files.filter((item) => item.id !== file.id)); setNotice('素材已刪除'); };
  return <div className="panel"><div className="panel-heading"><div><h3>素材管理</h3><p className="muted">支援 JPEG、PNG、WebP，單檔上限 10 MB {loading ? '・載入中…' : ''}</p>{notice && <span className="muted">{notice}</span>}</div><label className="small-btn"><Plus size={15} />上傳素材<input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void addFile(file); event.currentTarget.value = ''; }} /></label></div><div className="media-filters"><input aria-label="搜尋素材" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜尋檔名或替代文字" /><select aria-label="素材格式" value={mimeFilter} onChange={(event) => setMimeFilter(event.target.value as typeof mimeFilter)}><option value="all">全部格式</option><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></div>{error && <p className="error">{error}</p>}<div className="media-grid">{filteredFiles.map((file) => <div className="media-card" key={file.id}><img src={resolveMediaUrl(file.url, webOrigin)} alt={file.alt} /><strong>{file.name}</strong><small className="media-dimensions">{file.width && file.height ? `${file.width} × ${file.height}px` : '尺寸待讀取'}　{Math.round(file.size / 1024)} KB</small><input aria-label={`${file.name} 替代文字`} defaultValue={file.alt} onBlur={(event) => void updateAlt(file, event.target.value)} placeholder="替代文字" /><button className="text-btn" onClick={(event) => { const input = event.currentTarget.previousElementSibling as HTMLInputElement | null; if (input) void updateAlt(file, input.value); }}>儲存替代文字</button><button className="danger media-delete" type="button" onClick={() => void remove(file)}>刪除素材</button></div>)}</div>{filteredFiles.length === 0 && <p className="empty">沒有符合條件的素材。</p>}</div>;
}

function MessagesEditor({ values, setValues }: { values: AdminMessage[]; setValues: (values: AdminMessage[]) => void }) {
  const [selectedId, setSelectedId] = useState(values[0]?.id); const [filter, setFilter] = useState<'all' | 'unread' | 'handled'>('all'); const [page, setPage] = useState(1); const [notice, setNotice] = useState(''); const [dirty, setDirty] = useState(false);
  const filtered = values.filter((item) => filter === 'all' || item.status === filter); const pageSize = 8; const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize)); const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize); const selected = pageItems.find((item) => item.id === selectedId) || pageItems[0];
  useEffect(() => { if (page > totalPages) setPage(totalPages); if (!selected && pageItems[0]) setSelectedId(pageItems[0].id); }, [page, totalPages, selected, pageItems]);
  useUnsavedWarning(dirty, 'messages');
  const selectMessage = (id: string) => { if (id === selectedId) return; if (dirty && !window.confirm('有尚未儲存的留言備註，確定要切換嗎？')) return; setSelectedId(id); setDirty(false); setNotice(''); };
  const markHandled = async () => { if (!selected) return; const next = { ...selected, status: 'handled' as const }; setValues(values.map((item) => item.id === selected.id ? next : item)); const result = await saveMessage(next); if (result.ok) setDirty(false); setNotice(result.ok ? '留言已標記處理' : `儲存失敗：${result.error}`); };
  const saveNote = async () => { if (!selected) return; const result = await saveMessage(selected); if (result.ok) setDirty(false); setNotice(result.ok ? '內部備註已儲存' : `儲存失敗：${result.error}`); };
  const remove = async () => { if (!selected || !confirm(`確定刪除「${selected.name}」的留言？`)) return; const result = await deleteMessage(selected.id); if (!result.ok) { setNotice(`刪除失敗：${result.error}`); return; } const remaining = values.filter((item) => item.id !== selected.id); setValues(remaining); setSelectedId(remaining[0]?.id); setDirty(false); setNotice('留言已刪除'); };
  const updateNote = (note: string) => { if (!selected) return; setValues(values.map((item) => item.id === selected.id ? { ...item, note } : item)); setDirty(true); };
  return <div className="editor-layout"><div className="panel list-panel"><div className="panel-heading"><div><h3>聯絡留言</h3><span className="count">{values.filter((item) => item.status === 'unread').length} 未處理</span></div><div className="tabs"><button className={filter === 'all' ? 'active' : ''} onClick={() => { setFilter('all'); setPage(1); }}>全部</button><button className={filter === 'unread' ? 'active' : ''} onClick={() => { setFilter('unread'); setPage(1); }}>未處理</button><button className={filter === 'handled' ? 'active' : ''} onClick={() => { setFilter('handled'); setPage(1); }}>已處理</button></div></div>{pageItems.length === 0 && <p className="empty">目前沒有留言</p>}{pageItems.map((item) => <button className={item.id === selected?.id ? 'list-item selected' : 'list-item'} key={item.id} onClick={() => selectMessage(item.id)}><span>{item.name}</span><small>{item.status === 'unread' ? '未處理' : '已處理'}</small></button>)}{totalPages > 1 && <div className="admin-pagination"><button disabled={page === 1} onClick={() => setPage(page - 1)}>上一頁</button><span>{page} / {totalPages}</span><button disabled={page === totalPages} onClick={() => setPage(page + 1)}>下一頁</button></div>}</div>{selected && <div className="panel form-panel"><div className="panel-heading"><div><h3>{selected.name} 的留言 {dirty && <span className="unsaved-indicator">尚未儲存</span>}</h3>{notice && <span className="muted">{notice}</span>}</div><div className="message-actions"><button className="save-btn" onClick={() => void markHandled()}><Save size={15} />標記已處理</button><button className="secondary-btn" onClick={() => void saveNote()}><Save size={15} />儲存備註</button><button className="danger" onClick={() => void remove()}><Trash2 size={15} />刪除留言</button></div></div><p><b>電話：</b>{selected.phone}</p><p><b>Email：</b>{selected.email || '未提供'}</p><p><b>時間：</b>{new Date(selected.createdAt).toLocaleString('zh-TW')}</p><p className="message-body">{selected.message}</p><FormField label="內部備註" value={selected.note || ''} onChange={updateNote} /><p className="muted">備註可單獨儲存，也會在標記處理時一併保存。</p></div>}</div>;
}

function SettingsEditor({ value, setValue, loading, media }: { value: typeof seedSettings; setValue: (value: typeof seedSettings) => void; loading: boolean; media: AdminMedia[] }) {
  const [notice, setNotice] = useState(''); const [dirty, setDirty] = useState(false); const normalized = { ...seedSettings, ...value };
  useUnsavedWarning(dirty, 'settings');
  const update = (key: keyof typeof normalized, next: string) => { setValue({ ...normalized, [key]: next }); setDirty(true); };
  const save = async () => { const validationError = validateSettingsFields(normalized); if (validationError) { setNotice(validationError); return; } const result = await saveSettings(normalized); if (result.ok) setDirty(false); setNotice(result.ok ? '網站設定已儲存' : `儲存失敗：${result.error}`); };
  return <div className="panel form-panel narrow"><div className="panel-heading"><div><h3>網站基本設定</h3><p className="muted">{loading ? '載入中…' : adminRemoteEnabled ? '儲存後刷新官網即可看到更新' : '開發模式儲存在此瀏覽器；設定伺服器 API 後才會同步官網'} {dirty && <span className="unsaved-indicator">尚未儲存</span>} {notice && `・${notice}`}</p></div><button type="button" className="save-btn" onClick={() => void save()}><Save size={15} />儲存</button></div><FormField label="品牌名稱" value={normalized.brandName} onChange={(next) => update('brandName', next)} /><FormField label="Logo 圖片網址" value={normalized.logoUrl} onChange={(next) => update('logoUrl', next)} /><MediaPicker value={normalized.logoUrl} onChange={(asset) => update('logoUrl', asset.url)} files={media} /><FormField label="聯絡電話" value={normalized.phone} onChange={(next) => update('phone', next)} /><FormField label="LINE ID" value={normalized.line} onChange={(next) => update('line', next)} /><FormField label="地址" value={normalized.address} onChange={(next) => update('address', next)} /><FormField label="營業時間" value={normalized.hours} onChange={(next) => update('hours', next)} /><FormField label="地圖 Embed URL" value={normalized.mapEmbedUrl} onChange={(next) => update('mapEmbedUrl', next)} /><div className="two-fields"><FormField label="Instagram URL" value={normalized.instagram} onChange={(next) => update('instagram', next)} /><FormField label="Facebook URL" value={normalized.facebook} onChange={(next) => update('facebook', next)} /></div><FormField label="YouTube URL" value={normalized.youtube} onChange={(next) => update('youtube', next)} /><FormField label="SEO 標題" value={normalized.seoTitle} onChange={(next) => update('seoTitle', next)} /><FormField label="SEO 描述" value={normalized.seoDescription} textarea onChange={(next) => update('seoDescription', next)} /><FormField label="分享圖片網址" value={normalized.ogImageUrl} onChange={(next) => update('ogImageUrl', next)} /><MediaPicker value={normalized.ogImageUrl} onChange={(asset) => update('ogImageUrl', asset.url)} files={media} /><FormField label="隱私權政策" value={normalized.privacy} textarea onChange={(next) => update('privacy', next)} /><FormField label="服務條款" value={normalized.terms} textarea onChange={(next) => update('terms', next)} /><div className="notice">第一版固定版型只開放內容欄位編輯。背景、Logo 與分享圖可填入素材管理產生的網址，正式地圖網址請在上線前確認。</div></div>;
}

function HomeContentEditor({ value, setValue, media }: { value: typeof seedSettings; setValue: (value: typeof seedSettings) => void; media: AdminMedia[] }) {
  const [notice, setNotice] = useState('');
  const [dirty, setDirty] = useState(false);
  const [benefitsRaw, setBenefitsRaw] = useState(() => JSON.stringify(value.benefits, null, 2));
  const [pricingBenefitsRaw, setPricingBenefitsRaw] = useState(() => JSON.stringify(value.pricingBenefits, null, 2));
  const normalized = { ...seedSettings, ...value };
  useEffect(() => { setBenefitsRaw(JSON.stringify(value.benefits, null, 2)); }, [value.benefits]);
  useEffect(() => { setPricingBenefitsRaw(JSON.stringify(value.pricingBenefits, null, 2)); }, [value.pricingBenefits]);
  useUnsavedWarning(dirty, 'home-content');
  type TextKey = Exclude<keyof typeof seedSettings, 'benefits' | 'pricingBenefits'>;
  const update = (key: TextKey, next: string) => { setValue({ ...normalized, [key]: next }); setDirty(true); };
  const save = async () => {
    const validationError = validateSettingsFields(normalized);
    if (validationError) { setNotice(validationError); return; }
    let benefits: typeof normalized.benefits;
    let pricingBenefits: typeof normalized.pricingBenefits;
    try {
      const parsed: unknown = JSON.parse(benefitsRaw);
      if (!isValidBenefits(parsed)) { setNotice('特色列最多 4 筆，且 title 最多 120 字、caption 最多 240 字'); return; }
      benefits = parsed;
    } catch { setNotice('特色列必須是合法 JSON'); return; }
    try {
      const parsed: unknown = JSON.parse(pricingBenefitsRaw);
      if (!isValidBenefits(parsed)) { setNotice('價格特色列最多 4 筆，且 title 最多 120 字、caption 最多 240 字'); return; }
      pricingBenefits = parsed;
    } catch { setNotice('價格特色列必須是合法 JSON'); return; }
    const result = await saveSettings({ ...normalized, benefits, pricingBenefits });
    if (result.ok) setDirty(false);
    setNotice(result.ok ? '首頁區塊已儲存' : `儲存失敗：${result.error}`);
  };
  const updateBenefits = (kind: 'news' | 'pricing', raw: string) => {
    if (kind === 'news') setBenefitsRaw(raw);
    else setPricingBenefitsRaw(raw);
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isValidBenefits(parsed)) {
        setNotice(`${kind === 'pricing' ? '價格' : ''}特色列最多 4 筆，且 title 最多 120 字、caption 最多 240 字`);
        return;
      }
      setValue({ ...normalized, [kind === 'pricing' ? 'pricingBenefits' : 'benefits']: parsed });
      setDirty(true);
      setNotice('');
    } catch {
      setNotice('特色列必須是合法 JSON');
    }
  };
  return <div className="panel form-panel home-content-editor">
    <div className="panel-heading"><div><h3>首頁區塊設定</h3><p className="muted">固定版型只編輯文字、背景網址及特色列。{dirty && <span className="unsaved-indicator">尚未儲存</span>}{notice && `・${notice}`}</p></div><button type="button" className="save-btn" onClick={() => void save()}><Save size={15} />儲存</button></div>
    <div className="home-editor-section"><h4>主視覺</h4><div className="two-fields"><FormField label="主標題" value={normalized.heroTitle} onChange={(next) => update('heroTitle', next)} /><FormField label="副標題" value={normalized.heroSubtitle} onChange={(next) => update('heroSubtitle', next)} /></div><FormField label="標語" value={normalized.tagline} onChange={(next) => update('tagline', next)} /><FormField label="說明文字" value={normalized.heroDescription} onChange={(next) => update('heroDescription', next)} /><FormField label="背景圖片網址" value={normalized.heroBackgroundUrl} onChange={(next) => update('heroBackgroundUrl', next)} /><MediaPicker value={normalized.heroBackgroundUrl} onChange={(asset) => update('heroBackgroundUrl', asset.url)} files={media} /></div>
    <div className="home-editor-section"><h4>服務與價格</h4><div className="two-fields"><FormField label="服務標題" value={normalized.servicesTitle} onChange={(next) => update('servicesTitle', next)} /><FormField label="服務副標題" value={normalized.servicesSubtitle} onChange={(next) => update('servicesSubtitle', next)} /></div><FormField label="服務說明" value={normalized.servicesNote} textarea onChange={(next) => update('servicesNote', next)} /><FormField label="服務區背景圖片網址" value={normalized.servicesBackgroundUrl} onChange={(next) => update('servicesBackgroundUrl', next)} /><MediaPicker value={normalized.servicesBackgroundUrl} onChange={(asset) => update('servicesBackgroundUrl', asset.url)} files={media} /><div className="two-fields"><FormField label="價格標題" value={normalized.pricingTitle} onChange={(next) => update('pricingTitle', next)} /><FormField label="價格副標題" value={normalized.pricingSubtitle} onChange={(next) => update('pricingSubtitle', next)} /></div><FormField label="價格區背景圖片網址" value={normalized.pricingBackgroundUrl} onChange={(next) => update('pricingBackgroundUrl', next)} /><MediaPicker value={normalized.pricingBackgroundUrl} onChange={(asset) => update('pricingBackgroundUrl', asset.url)} files={media} /></div>
    <div className="home-editor-section"><h4>消息與部落格</h4><div className="two-fields"><FormField label="消息標題" value={normalized.newsTitle} onChange={(next) => update('newsTitle', next)} /><FormField label="消息副標題" value={normalized.newsSubtitle} onChange={(next) => update('newsSubtitle', next)} /></div><FormField label="消息區背景圖片網址" value={normalized.newsBackgroundUrl} onChange={(next) => update('newsBackgroundUrl', next)} /><MediaPicker value={normalized.newsBackgroundUrl} onChange={(asset) => update('newsBackgroundUrl', asset.url)} files={media} /><div className="two-fields"><FormField label="部落格標題" value={normalized.blogTitle} onChange={(next) => update('blogTitle', next)} /><FormField label="部落格副標題" value={normalized.blogSubtitle} onChange={(next) => update('blogSubtitle', next)} /></div><FormField label="部落格區背景圖片網址" value={normalized.blogBackgroundUrl} onChange={(next) => update('blogBackgroundUrl', next)} /><MediaPicker value={normalized.blogBackgroundUrl} onChange={(asset) => update('blogBackgroundUrl', asset.url)} files={media} /></div>
    <div className="home-editor-section"><h4>聯繫區與特色列</h4><div className="two-fields"><FormField label="聯繫標題" value={normalized.contactTitle} onChange={(next) => update('contactTitle', next)} /><FormField label="聯繫副標題" value={normalized.contactLead} onChange={(next) => update('contactLead', next)} /></div><FormField label="聯繫區背景圖片網址" value={normalized.contactBackgroundUrl} onChange={(next) => update('contactBackgroundUrl', next)} /><MediaPicker value={normalized.contactBackgroundUrl} onChange={(asset) => update('contactBackgroundUrl', asset.url)} files={media} /><FormField label="消息特色列 JSON（title/caption）" value={benefitsRaw} textarea onChange={(raw) => updateBenefits('news', raw)} /><FormField label="價格信任列 JSON（title/caption）" value={pricingBenefitsRaw} textarea onChange={(raw) => updateBenefits('pricing', raw)} /></div>
    <div className="notice">圖片可先使用素材管理中的網址。兩組特色列都只接受 JSON 陣列，每筆格式為 <code>{'{"title":"標題","caption":"說明"}'}</code>。{adminRemoteEnabled ? ' 儲存後重新整理官網即可同步。' : ' 開發模式只保存於此瀏覽器，正式同步需設定伺服器 API。'}</div>
  </div>;
}

type AdminWindow = Window & { __tianXingeAdminRoot?: Root };
const adminWindow = window as AdminWindow;
const adminRoot = adminWindow.__tianXingeAdminRoot ?? createRoot(document.getElementById('root')!);
adminWindow.__tianXingeAdminRoot = adminRoot;
adminRoot.render(<BrowserRouter><App /></BrowserRouter>);
