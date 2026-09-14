import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Image as ImageIcon, Settings, Sparkles, Newspaper, Mail, Menu, Save, Plus, Trash2, ExternalLink } from 'lucide-react';
import { fixtureArticles, fixtureCategories, fixtureMedia, fixtureMessages, fixtureServices, fixtureSettings, isSafeContentUrl, isValidArticleBody, isValidBenefits, type Article, type Service } from '@tian-xin-ge/contracts';
import './styles.css';
import { adminSupabase } from './supabase';
import { deleteCategory, deleteMedia, deleteMessage, deleteService, loadArticles, loadCategories, loadMedia, loadMessages, loadServices, loadSettings, saveArticle, saveCategory, saveMediaAlt, saveMessage, saveService, saveSettings, uploadMedia, type AdminCategory, type ManagedArticle, type AdminMessage, type AdminMedia } from './repositories';

const webOrigin = import.meta.env.VITE_WEB_URL || 'http://localhost:3000';
const seedServices: Service[] = fixtureServices;
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
};

function useStored<T>(key: string, initial: T, loader?: () => Promise<T | null>) {
  const [value, setValue] = useState<T>(() => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : initial; } catch { return initial; } });
  const [loading, setLoading] = useState(Boolean(loader && adminSupabase));
  const [loadError, setLoadError] = useState(false);
  useEffect(() => { if (!loader || !adminSupabase) return; setLoadError(false); void loader().then((remote) => { if (remote !== null) setValue(remote); else setLoadError(true); }).catch(() => setLoadError(true)).finally(() => setLoading(false)); }, [loader]);
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
  const [logged, setLogged] = useState(() => !adminSupabase && !import.meta.env.PROD && sessionStorage.getItem('tian-admin') === '1');
  const [recovering, setRecovering] = useState(false);
  const [authNotice, setAuthNotice] = useState('');
  const explicitSignOut = useRef(false);
  useEffect(() => {
    if (!adminSupabase) return;
    const client = adminSupabase;
    const verifySession = async (session: Awaited<ReturnType<typeof client.auth.getSession>>['data']['session']) => {
      if (!session) {
        sessionStorage.removeItem('tian-admin');
        setLogged(false);
        if (!explicitSignOut.current) setAuthNotice('登入已逾時，請重新登入。');
        explicitSignOut.current = false;
        return;
      }
      const { data } = await client.from('admin_users').select('user_id').eq('user_id', session.user.id).maybeSingle();
      if (!data) {
        explicitSignOut.current = true;
        await client.auth.signOut();
        sessionStorage.removeItem('tian-admin');
        setLogged(false);
        setAuthNotice('此帳號沒有後台管理權限，請使用管理員帳號登入。');
        return;
      }
      sessionStorage.setItem('tian-admin', '1');
      setAuthNotice('');
      setLogged(true);
    };
    const { data } = client.auth.onAuthStateChange((event, session) => { if (event === 'PASSWORD_RECOVERY') setRecovering(true); if (event === 'INITIAL_SESSION') void verifySession(session); if (event === 'SIGNED_OUT') void verifySession(null); });
    return () => data.subscription.unsubscribe();
  }, []);
  const logout = async () => { explicitSignOut.current = true; if (adminSupabase) await adminSupabase.auth.signOut(); sessionStorage.removeItem('tian-admin'); setLogged(false); };
  if (recovering) return <ResetPassword onDone={() => { setRecovering(false); void logout(); }} />;
  return logged ? <Dashboard onLogout={logout} /> : <Login notice={authNotice} onLogin={() => { sessionStorage.setItem('tian-admin', '1'); setAuthNotice(''); setLogged(true); }} />;
}

function ResetPassword({ onDone }: { onDone: () => void }) { const [password, setPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState(''); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const submit = async (event: React.FormEvent) => { event.preventDefault(); if (password.length < 8 || password !== confirmPassword) { setError(password.length < 8 ? '密碼至少需要 8 個字元' : '兩次密碼不一致'); return; } if (!adminSupabase) { setMessage('開發模式無法重設密碼'); return; } const result = await adminSupabase.auth.updateUser({ password }); if (result.error) setError('密碼更新失敗，請重新申請重設信件'); else setMessage('密碼已更新，請重新登入'); }; return <div className="login-page"><div className="login-card"><h1>設定新密碼</h1><form onSubmit={submit}><label>新密碼<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" /></label><label>確認新密碼<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" /></label>{error && <small className="error">{error}</small>}{message && <small className="muted">{message}</small>}{message ? <button type="button" className="primary" onClick={onDone}>回到登入</button> : <button className="primary">更新密碼</button>}</form></div></div>; }

function Login({ onLogin, notice }: { onLogin: () => void; notice?: string }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(''); if (!email.trim() || !password.trim()) { setError('請輸入管理員帳號與密碼'); return; } setBusy(true); if (adminSupabase) { const result = await adminSupabase.auth.signInWithPassword({ email: email.trim(), password }); if (result.error || !result.data.user) { setError('帳號或密碼不正確'); setBusy(false); return; } const admin = await adminSupabase.from('admin_users').select('user_id').eq('user_id', result.data.user.id).maybeSingle(); if (admin.error || !admin.data) { await adminSupabase.auth.signOut(); setError('此帳號沒有後台管理權限'); setBusy(false); return; } } else if (import.meta.env.PROD) { setError('正式環境尚未設定 Supabase Auth'); setBusy(false); return; } onLogin(); setBusy(false); };
  const reset = async () => { setError(''); setMessage(''); if (!email.trim()) { setError('請先輸入管理員 Email'); return; } if (!adminSupabase) { setMessage(import.meta.env.PROD ? '正式環境尚未設定 Supabase Auth' : '開發模式不會寄送重設信件，正式環境請設定 Supabase Auth'); return; } const result = await adminSupabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin }); if (result.error) setError('目前無法寄送重設信件'); else setMessage('重設密碼信件已寄出，請查看信箱'); };
  return <div className="login-page"><div className="login-card"><img src={`${webOrigin}/assets/logo/logo_1_去背.png`} alt="天心閣" /><p>天心閣養生會館</p><h1>內容管理後台</h1>{notice && <p className="auth-notice" role="status">{notice}</p>}<form onSubmit={submit}><label>管理員帳號<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="username" placeholder="admin@example.com" /></label><label>密碼<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" placeholder="••••••••" /></label>{error && <small className="error">{error}</small>}{message && <small className="muted">{message}</small>}<button className="primary" disabled={busy}>{busy ? '登入中…' : '登入後台'}</button><button type="button" className="text-btn" onClick={() => void reset()}>忘記密碼？寄送重設信件</button></form><small>{adminSupabase ? '登入由 Supabase Auth 驗證，並檢查管理員權限' : import.meta.env.PROD ? '正式環境必須設定 Supabase Auth' : '尚未設定 Supabase，開發模式允許測試帳號登入'}</small></div></div>;
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const location = useLocation(); const navigate = useNavigate(); const [collapsed, setCollapsed] = useState(false); const active = ({ '/': 'overview', '/services': 'services', '/articles': 'articles', '/media': 'media', '/messages': 'messages', '/settings': 'settings' } as Record<string, string>)[location.pathname] || 'overview'; const go = (id: string) => { if (hasUnsavedChanges() && !window.confirm('有尚未儲存的變更，確定要離開嗎？')) return; navigate(id === 'overview' ? '/' : `/${id}`); };
  const [services, setServices, servicesLoading, servicesError] = useStored('txg-services', seedServices, loadServices);
  const [messages, setMessages, messagesLoading, messagesError] = useStored<AdminMessage[]>('txg-messages', seedMessages, loadMessages);
  const [settings, setSettings, settingsLoading, settingsError] = useStored('txg-settings', seedSettings, loadSettings);
  const [articles, , , articlesError] = useStored<ManagedArticle[]>('txg-articles', seedArticles, loadArticles);
  const [media, , , mediaError] = useStored<AdminMedia[]>('txg-media', seedMedia, loadMedia);
  const remoteLoadError = servicesError || messagesError || settingsError || articlesError || mediaError;
  const labels: Record<string, string> = { overview: '總覽', services: '服務價格', articles: '最新消息與部落格', media: '素材管理', messages: '聯絡留言', settings: '網站設定' };
  const logout = () => { if (hasUnsavedChanges() && !window.confirm('有尚未儲存的變更，確定要登出嗎？')) return; onLogout(); };
  return <div className={collapsed ? 'admin-shell collapsed' : 'admin-shell'}><aside><div className="admin-brand"><img src={`${webOrigin}/assets/logo/logo_1_去背.png`} alt="" /><span>天心閣<small>管理後台</small></span></div><nav><Nav icon={<LayoutDashboard />} label="總覽" id="overview" active={active} set={go} /><Nav icon={<Sparkles />} label="服務價格" id="services" active={active} set={go} /><Nav icon={<Newspaper />} label="最新消息與部落格" id="articles" active={active} set={go} /><Nav icon={<ImageIcon />} label="素材管理" id="media" active={active} set={go} /><Nav icon={<Mail />} label="聯絡留言" id="messages" active={active} set={go} /><Nav icon={<Settings />} label="網站設定" id="settings" active={active} set={go} /></nav><button className="logout" onClick={logout}><LogOut />登出</button></aside><section className="admin-main"><header><button className="icon-btn" aria-label="收合選單" onClick={() => setCollapsed(!collapsed)}><Menu /></button><div><h1>{labels[active]}</h1><small>天心閣養生會館 / 管理後台</small></div><a href={webOrigin} target="_blank" rel="noreferrer" className="view-site">查看網站 <ExternalLink size={15} /></a></header><div className="admin-content">{remoteLoadError && <div className="error-banner" role="alert">正式資料讀取失敗，目前顯示本機快照；請檢查 Supabase 連線與權限後重新整理。</div>}{active === 'overview' && <Overview services={services} messages={messages} articles={articles} mediaCount={media.length} loading={servicesLoading || messagesLoading} />} {active === 'services' && <ServicesEditor values={services} setValues={setServices} />} {active === 'articles' && <><ArticlesEditor /><CategoryManager /></>} {active === 'media' && <MediaEditor />} {active === 'messages' && <MessagesEditor values={messages} setValues={setMessages} />} {active === 'settings' && <><SettingsEditor value={settings} setValue={setSettings} loading={settingsLoading} /><HomeContentEditor value={settings} setValue={setSettings} /></>}</div></section></div>;
}
function Nav({ icon, label, id, active, set }: { icon: React.ReactNode; label: string; id: string; active: string; set: (id: string) => void }) { return <button className={active === id ? 'side-nav active' : 'side-nav'} onClick={() => set(id)}>{icon}<span>{label}</span></button>; }
function Overview({ services, messages, articles, mediaCount, loading }: { services: Service[]; messages: AdminMessage[]; articles: ManagedArticle[]; mediaCount: number; loading: boolean }) { return <div><div className="welcome"><div><span className="eyebrow">WELCOME BACK</span><h2>今天也一起讓生活更美好</h2><p>從這裡管理網站內容，儲存後重新整理官網即可看見更新。</p></div><a className="primary" href={webOrigin} target="_blank" rel="noreferrer">前往官網 <ExternalLink size={15} /></a></div><div className="stats"><Stat label="上架服務" value={services.filter((s) => s.isVisible).length} /><Stat label="文章總數" value={articles.length} /><Stat label="未處理留言" value={messages.filter((m) => m.status === 'unread').length} /><Stat label="素材數量" value={mediaCount} /></div><div className="panel quick"><h3>快速操作</h3><p>{loading ? '正在載入資料…' : '使用左側選單編輯固定版型內容，所有表單都有儲存前驗證。'}</p><div><span>✓　公開頁面資料與後台分離</span><span>✓　草稿不會出現在官網</span><span>✓　圖片上限 10 MB</span></div></div></div>; }
function Stat({ label, value }: { label: string; value: string | number }) { return <div className="stat"><small>{label}</small><strong>{value}</strong><span>管理內容　→</span></div>; }

function MediaPicker({ value, onChange }: { value: string; onChange: (asset: Pick<AdminMedia, 'id' | 'url' | 'alt'>) => void }) {
  const [files] = useStored<AdminMedia[]>('txg-media', seedMedia, loadMedia);
  return <div className="media-picker"><span>快速選擇素材</span><div>{files.map((file) => <button type="button" key={file.id} className={file.url === value ? 'selected' : ''} aria-label={`選擇 ${file.name}`} aria-pressed={file.url === value} onClick={() => onChange(file)}><img src={file.url} alt={file.alt || ''} /><small>{file.name}</small></button>)}</div>{files.length === 0 && <small className="muted">請先至素材管理上傳圖片</small>}</div>;
}

function validateService(service: Service, values: Service[]): string | null {
  if (!service.name.trim() || !service.slug.trim()) return '服務名稱與 slug 為必填';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(service.slug.trim())) return 'slug 僅能使用英數字與連字號';
  if (values.some((item) => item.id !== service.id && item.slug.trim().toLowerCase() === service.slug.trim().toLowerCase())) return 'slug 不可重複';
  if (service.name.length > 120 || service.summary.length > 240 || service.description.length > 2000) return '名稱最多 120 字、摘要 240 字、介紹 2000 字';
  if (!isSafeBodyUrl(service.imageUrl, true)) return '圖片網址必須是 https:// 或網站內部路徑';
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

function ServicesEditor({ values, setValues }: { values: Service[]; setValues: (values: Service[]) => void }) {
  const [selectedId, setSelectedId] = useState(values[0]?.id); const [notice, setNotice] = useState(''); const [dirty, setDirty] = useState(false); const current = values.find((item) => item.id === selectedId) || values[0];
  useUnsavedWarning(dirty, 'services');
  const selectService = (id: string) => { if (id === selectedId) return; if (dirty && !window.confirm('有尚未儲存的服務變更，確定要切換嗎？')) return; setSelectedId(id); setDirty(false); setNotice(''); };
  const update = (key: keyof Service, value: unknown) => { if (!current) return; setValues(values.map((item) => item.id === current.id ? { ...item, [key]: value } : item)); setDirty(true); };
  const save = async () => { if (!current) return; const validationError = validateService(current, values); if (validationError) { setNotice(validationError); return; } const result = await saveService(current); if (result.ok && 'id' in result && result.id && result.id !== current.id) { setValues(values.map((item) => item.id === current.id ? { ...current, id: result.id } : item)); setSelectedId(result.id); } if (result.ok) setDirty(false); setNotice(result.ok ? '服務已儲存' : `儲存失敗：${result.error}`); };
  const add = () => { const id = `local-${Date.now()}`; const next: Service = { id, slug: `new-service-${values.length + 1}`, name: '新服務項目', summary: '', description: '', imageUrl: adminSupabase ? '' : '/assets/crops/service-1.png', icon: 'lotus', sortOrder: values.length + 1, isVisible: false }; setValues([...values, next]); setSelectedId(id); setDirty(true); };
  const remove = async () => { if (!current || !confirm('確定刪除此項目？')) return; const result = await deleteService(current.id); if (!result.ok) { setNotice(`刪除失敗：${result.error}`); return; } const remaining = values.filter((item) => item.id !== current.id); setValues(remaining); setSelectedId(remaining[0]?.id || ''); setDirty(false); setNotice('服務已刪除'); };
  return <div className="editor-layout"><div className="panel list-panel"><div className="panel-heading"><h3>服務項目</h3><button type="button" className="small-btn" onClick={add}><Plus size={15} />新增</button></div>{[...values].sort((a, b) => a.sortOrder - b.sortOrder).map((item) => <button type="button" key={item.id} className={item.id === current?.id ? 'list-item selected' : 'list-item'} onClick={() => selectService(item.id)}><span>{item.name}</span><small>{item.isVisible ? '已上架' : '已隱藏'}</small></button>)}</div>{current && <div className="panel form-panel"><div className="panel-heading"><div><h3>編輯服務</h3>{dirty && <span className="unsaved-indicator">尚未儲存</span>}{notice && <span className="muted">{notice}</span>}</div><button type="button" className="save-btn" onClick={() => void save()}><Save size={15} />儲存</button></div><FormField label="服務名稱" value={current.name} onChange={(value) => update('name', value)} /><FormField label="網址代稱（slug）" value={current.slug} onChange={(value) => update('slug', value)} /><FormField label="卡片摘要" value={current.summary} onChange={(value) => update('summary', value)} /><FormField label="介紹內容" value={current.description} textarea onChange={(value) => update('description', value)} /><FormField label="圖片網址" value={current.imageUrl} onChange={(value) => update('imageUrl', value)} /><MediaPicker value={current.imageUrl} onChange={(asset) => update('imageUrl', asset.url)} /><label className="field"><span>卡片圖示</span><select value={current.icon} onChange={(event) => update('icon', event.target.value as Service['icon'])}><option value="lotus">蓮花</option><option value="oil">精油瓶</option><option value="stone">熱石</option><option value="foot">足部</option><option value="flower">花朵</option></select></label><div className="two-fields"><FormField label="療程分鐘" value={String(current.durationMinutes ?? '')} onChange={(value) => update('durationMinutes', value ? Number(value) : undefined)} /><FormField label="排序" value={String(current.sortOrder)} onChange={(value) => update('sortOrder', Number(value) || 0)} /></div><div className="two-fields"><FormField label="價格（空白為洽詢）" value={String(current.price ?? '')} onChange={(value) => update('price', value ? Number(value) : undefined)} /><FormField label="價格顯示文字" value={current.priceLabel ?? ''} onChange={(value) => update('priceLabel', value || undefined)} /></div><label className="check"><input type="checkbox" checked={current.isVisible} onChange={(event) => update('isVisible', event.target.checked)} /> 顯示於官網</label><button type="button" className="danger" onClick={() => void remove()}><Trash2 size={15} />刪除項目</button></div>}</div>;
}
function FormField({ label, value, onChange, textarea }: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean }) { return <label className="field"><span>{label}</span>{textarea ? <textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} /> : <input value={value} onChange={(event) => onChange(event.target.value)} />}</label>; }

type EditableBodyBlock = Article['body'][number];
function BodyBlockEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const parse = (raw: string): EditableBodyBlock[] => { try { const parsed: unknown = JSON.parse(raw || '[]'); if (!Array.isArray(parsed)) return []; return parsed.filter((item): item is EditableBodyBlock => Boolean(item && typeof item === 'object' && ['heading', 'paragraph', 'list', 'link', 'image'].includes(String((item as Record<string, unknown>).type)) && typeof (item as Record<string, unknown>).text === 'string')).map((item) => ({ ...item, ...(item.type === 'list' ? { items: Array.isArray(item.items) ? item.items.filter((entry): entry is string => typeof entry === 'string') : [] } : {}) })); } catch { return []; } };
  const [blocks, setBlocks] = useState<EditableBodyBlock[]>(() => parse(value));
  useEffect(() => setBlocks(parse(value)), [value]);
  const commit = (next: EditableBodyBlock[]) => { setBlocks(next); onChange(JSON.stringify(next)); };
  const add = (type: EditableBodyBlock['type']) => { const defaults: Record<EditableBodyBlock['type'], EditableBodyBlock> = { heading: { type: 'heading', text: '新的段落標題' }, paragraph: { type: 'paragraph', text: '新的段落內容' }, list: { type: 'list', text: '清單標題', items: ['項目一'] }, link: { type: 'link', text: '連結文字', url: '' }, image: { type: 'image', text: '圖片說明', url: adminSupabase ? '' : '/assets/crops/news-1.png', alt: '圖片替代文字' } }; commit([...blocks, defaults[type]]); };
  const update = (index: number, key: 'text' | 'url' | 'alt', nextValue: string) => commit(blocks.map((block, blockIndex) => blockIndex === index ? { ...block, [key]: nextValue } : block));
  const updateItems = (index: number, raw: string) => commit(blocks.map((block, blockIndex) => blockIndex === index ? { ...block, items: raw.split('\n').map((item) => item.trim()).filter(Boolean) } : block));
  const move = (index: number, direction: -1 | 1) => { const target = index + direction; if (target < 0 || target >= blocks.length) return; const next = [...blocks]; [next[index], next[target]] = [next[target], next[index]]; commit(next); };
  return <div className="body-editor"><div className="body-editor-heading"><span>正文區塊</span><div><button type="button" onClick={() => add('heading')}>+ 標題</button><button type="button" onClick={() => add('paragraph')}>+ 段落</button><button type="button" onClick={() => add('list')}>+ 清單</button><button type="button" onClick={() => add('link')}>+ 連結</button><button type="button" onClick={() => add('image')}>+ 圖片</button></div></div>{blocks.length === 0 && <p className="muted">尚無正文區塊，或目前 JSON 格式無效；請新增區塊重新建立。</p>}{blocks.map((block, index) => <div className="body-block" key={`${block.type}-${index}`}><div className="body-block-top"><select aria-label={`第 ${index + 1} 個區塊類型`} value={block.type} onChange={(event) => { const nextType = event.target.value as EditableBodyBlock['type']; const next = parse(JSON.stringify(blocks)); const replacement = nextType === 'list' ? { type: 'list' as const, text: block.text, items: block.items || ['項目一'] } : nextType === 'link' ? { type: 'link' as const, text: block.text, url: block.url || '' } : nextType === 'image' ? { type: 'image' as const, text: block.text, url: block.url || (adminSupabase ? '' : '/assets/crops/news-1.png'), alt: block.alt || block.text } : { type: nextType as 'heading' | 'paragraph', text: block.text }; next[index] = replacement; commit(next); }}><option value="heading">標題</option><option value="paragraph">段落</option><option value="list">清單</option><option value="link">連結</option><option value="image">圖片</option></select><span>區塊 {index + 1}</span><button type="button" aria-label="上移" disabled={index === 0} onClick={() => move(index, -1)}>↑</button><button type="button" aria-label="下移" disabled={index === blocks.length - 1} onClick={() => move(index, 1)}>↓</button><button type="button" aria-label="刪除區塊" onClick={() => commit(blocks.filter((_, blockIndex) => blockIndex !== index))}>×</button></div><textarea rows={block.type === 'paragraph' ? 3 : 2} value={block.text} onChange={(event) => update(index, 'text', event.target.value)} />{block.type === 'list' && <textarea rows={3} value={(block.items || []).join('\n')} onChange={(event) => updateItems(index, event.target.value)} placeholder="每行一個清單項目" />}{(block.type === 'link' || block.type === 'image') && <input value={block.url || ''} onChange={(event) => update(index, 'url', event.target.value)} placeholder="安全 URL（https:// 或 /assets/...）" />}{block.type === 'image' && <><MediaPicker value={block.url || ''} onChange={(asset) => update(index, 'url', asset.url)} /><input value={block.alt || ''} onChange={(event) => update(index, 'alt', event.target.value)} placeholder="圖片替代文字" /></>}</div>)}<details className="body-json"><summary>查看儲存用 JSON</summary><pre>{JSON.stringify(blocks, null, 2)}</pre></details></div>;
}

const isSafeBodyUrl = isSafeContentUrl;
const isValidBody = isValidArticleBody;

function parsePreviewBody(raw: string): Article['body'] {
  try {
    const parsed: unknown = JSON.parse(raw || '[]');
    return isValidBody(parsed) ? parsed as Article['body'] : [];
  } catch {
    return [];
  }
}

function ArticlePreview({ article, onClose }: { article: ManagedArticle; onClose: () => void }) {
  const blocks = parsePreviewBody(article.body);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);
  return <div className="preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="preview-modal" role="dialog" aria-modal="true" aria-label="文章預覽"><header className="preview-header"><div><span className="eyebrow">{article.status === 'published' ? '已發布預覽' : '草稿預覽'}</span><strong>{article.type === 'news' ? '最新消息' : '部落格'}</strong></div><button type="button" className="icon-btn" aria-label="關閉預覽" onClick={onClose}>×</button></header><article className="preview-article"><span className="preview-category">{article.category || (article.type === 'news' ? '最新消息' : '養生知識')}</span><h1>{article.title || '未命名文章'}</h1>{article.excerpt && <p className="preview-excerpt">{article.excerpt}</p>}{article.coverUrl && isSafeBodyUrl(article.coverUrl, true) && <img src={article.coverUrl} alt="" className="preview-cover" />}{blocks.length === 0 ? <p className="muted">尚無正文內容</p> : <div className="preview-body">{blocks.map((block, index) => { if (block.type === 'heading') return <h2 key={index}>{block.text}</h2>; if (block.type === 'paragraph') return <p key={index}>{block.text}</p>; if (block.type === 'list') return <ul key={index}>{(block.items || []).map((item, itemIndex) => <li key={`${index}-${itemIndex}`}>{item}</li>)}</ul>; if (block.type === 'link') return <p key={index}><a href={block.url} target="_blank" rel="noreferrer">{block.text}</a></p>; return <figure key={index}><img src={block.url} alt={block.alt || block.text} /><figcaption>{block.text}</figcaption></figure>; })}</div>}</article></section></div>;
}

function ArticlesEditor() {
  const [type, setType] = useState<'news' | 'blog'>('news');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems, loading] = useStored<ManagedArticle[]>('txg-articles', seedArticles, loadArticles);
  const [selectedId, setSelectedId] = useState(items[0]?.id);
  const [notice, setNotice] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const filtered = useMemo(() => items.filter((item) => item.type === type && (statusFilter === 'all' || item.status === statusFilter) && (!keyword.trim() || `${item.title} ${item.excerpt}`.toLowerCase().includes(keyword.trim().toLowerCase()))), [items, type, statusFilter, keyword]);
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const selected = pageItems.find((item) => item.id === selectedId) || pageItems[0];
  useEffect(() => { if (page > totalPages) setPage(totalPages); if (!selected && pageItems[0]) setSelectedId(pageItems[0].id); }, [page, totalPages, selected, pageItems]);
  useUnsavedWarning(dirty, 'articles');
  const selectArticle = (id: string) => { if (id === selectedId) return; if (dirty && !window.confirm('有尚未儲存的文章變更，確定要切換嗎？')) return; setSelectedId(id); setDirty(false); setNotice(''); };
  const changeType = (nextType: 'news' | 'blog') => { if (nextType === type) return; if (hasUnsavedChanges() && !window.confirm('有尚未儲存的文章變更，確定要切換類型嗎？')) return; setType(nextType); setPage(1); setSelectedId(items.find((item) => item.type === nextType)?.id || ''); setDirty(false); };
  const update = (key: keyof ManagedArticle, value: string) => { if (!selected) return; setItems(items.map((item) => item.id === selected.id ? { ...item, [key]: value } : item)); setDirty(true); };
  const save = async () => { if (!selected?.title.trim()) { setNotice('標題為必填'); return; } if (selected.title.length > 160 || selected.excerpt.length > 1000) { setNotice('標題最多 160 字、摘要最多 1000 字'); return; } if (selected.publishedAt && !/^\d{4}-\d{2}-\d{2}$/.test(selected.publishedAt)) { setNotice('發布日期格式不正確'); return; } const slug = selected.slug.trim(); if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)) { setNotice('slug 僅能使用英數字與連字號'); return; } if (slug && items.some((item) => item.id !== selected.id && item.slug.trim().toLowerCase() === slug.toLowerCase())) { setNotice('slug 不可重複'); return; } const coverUrl = selected.coverUrl?.trim() || ''; if (coverUrl && !isSafeBodyUrl(coverUrl, true)) { setNotice('封面圖片網址必須是 https:// 或網站內部路徑'); return; } let parsed: unknown; try { parsed = JSON.parse(selected.body || '[]'); } catch { setNotice('正文必須是合法 JSON 陣列'); return; } if (!isValidBody(parsed)) { setNotice('正文只能使用 heading、paragraph、list、link、image block'); return; } const prepared = { ...selected, slug: slug || `${selected.type}-${Date.now()}`, coverUrl }; const result = await saveArticle(prepared); if (result.ok && 'id' in result && result.id) { setItems(items.map((item) => item.id === selected.id ? { ...prepared, id: result.id } : item)); setSelectedId(result.id); } else if (prepared.slug !== selected.slug || prepared.coverUrl !== selected.coverUrl) setItems(items.map((item) => item.id === selected.id ? prepared : item)); if (result.ok) setDirty(false); setNotice(result.ok ? '文章已儲存' : `儲存失敗：${result.error}`); };
  const add = () => { const next: ManagedArticle = { id: `local-${Date.now()}`, slug: `${type}-new-${Date.now()}`, title: '新文章', category: type === 'news' ? '活動訊息' : '養生知識', status: 'draft', excerpt: '', type, body: '[]', coverUrl: adminSupabase ? '' : '/assets/crops/news-1.png' }; setItems([...items, next]); setSelectedId(next.id); setDirty(true); };
  const toggleStatus = (published: boolean) => { if (!selected) return; setItems(items.map((item) => item.id === selected.id ? { ...item, status: published ? 'published' : 'draft' } : item)); setDirty(true); };
  return <><div className="editor-layout article-editor"><div className="panel list-panel"><div className="panel-heading"><div><h3>文章內容</h3><div className="tabs"><button type="button" className={type === 'news' ? 'active' : ''} onClick={() => changeType('news')}>最新消息</button><button type="button" className={type === 'blog' ? 'active' : ''} onClick={() => changeType('blog')}>部落格</button></div></div><button type="button" className="small-btn" onClick={add}><Plus size={15} />新增</button></div><div className="article-filters"><input aria-label="搜尋文章" placeholder="搜尋標題或摘要" value={keyword} onChange={(event) => { setKeyword(event.target.value); setPage(1); }} /><select aria-label="文章狀態" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as typeof statusFilter); setPage(1); }}><option value="all">全部狀態</option><option value="published">已發布</option><option value="draft">草稿</option></select></div>{loading && <p className="muted">載入中…</p>}{pageItems.length === 0 && <p className="empty">目前沒有符合條件的文章。</p>}{pageItems.map((item) => <button type="button" className={item.id === selected?.id ? 'list-item selected' : 'list-item'} key={item.id} onClick={() => selectArticle(item.id)}><span>{item.title}</span><small>{item.status === 'published' ? '已發布' : '草稿'}</small></button>)}{totalPages > 1 && <div className="admin-pagination"><button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>上一頁</button><span>{page} / {totalPages}</span><button type="button" disabled={page === totalPages} onClick={() => setPage(page + 1)}>下一頁</button></div>}</div>{selected && <div className="panel form-panel"><div className="panel-heading"><div><h3>文章編輯</h3>{notice && <span className="muted">{notice}</span>}</div><div className="editor-actions">{dirty && <span className="unsaved-indicator">尚未儲存</span>}<button type="button" className="secondary-btn" onClick={() => setPreviewing(true)}><ExternalLink size={15} />預覽</button><button type="button" className="save-btn" onClick={() => void save()}><Save size={15} />儲存</button></div></div><div className="two-fields"><FormField label="文章類型" value={selected.type === 'news' ? '最新消息' : '部落格'} onChange={() => undefined} /><FormField label="網址代稱（slug）" value={selected.slug || `${selected.type}-draft`} onChange={(value) => update('slug', value)} /></div><FormField label="文章標題" value={selected.title} onChange={(value) => update('title', value)} /><FormField label="分類" value={selected.category} onChange={(value) => update('category', value)} /><label className="field"><span>發布日期</span><input type="date" value={selected.publishedAt || new Date().toISOString().slice(0, 10)} onChange={(event) => update('publishedAt', event.target.value)} /></label><FormField label="摘要" value={selected.excerpt} textarea onChange={(value) => update('excerpt', value)} /><div className="two-fields"><FormField label="SEO 標題" value={selected.seoTitle || ''} onChange={(value) => update('seoTitle', value)} /><FormField label="SEO 描述" value={selected.seoDescription || ''} onChange={(value) => update('seoDescription', value)} /></div><FormField label="封面圖片網址" value={selected.coverUrl || ''} onChange={(value) => update('coverUrl', value)} /><MediaPicker value={selected.coverUrl || ''} onChange={(asset) => update('coverUrl', asset.url)} /><BodyBlockEditor value={selected.body} onChange={(value) => update('body', value)} /><label className="check"><input type="checkbox" checked={selected.status === 'published'} onChange={(event) => toggleStatus(event.target.checked)} /> 已發布</label><div className="notice">正文接受 heading、paragraph、list、link、image block，預覽與前台都不渲染任意 HTML。儲存前會檢查 JSON 陣列格式。</div></div>}</div>{previewing && selected && <ArticlePreview article={selected} onClose={() => setPreviewing(false)} />}</>;
}

function CategoryManager() {
  const [categories, setCategories, loading] = useStored<AdminCategory[]>('txg-categories', seedCategories, loadCategories);
  const [type, setType] = useState<'news' | 'blog'>('news');
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [notice, setNotice] = useState('');
  const visible = categories.filter((category) => category.type === type);
  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 80) { setNotice('分類名稱為必填且最多 80 字'); return; }
    if (categories.some((category) => category.name.trim().toLocaleLowerCase() === trimmed.toLocaleLowerCase())) { setNotice('分類名稱不可重複'); return; }
    const next: AdminCategory = { id: `local-${Date.now()}`, name: trimmed, type };
    setCategories([...categories, next]); setName('');
    const result = await saveCategory(next);
    if (result.ok && 'id' in result && result.id) setCategories([...categories.filter((item) => item.id !== next.id), { ...next, id: result.id }]);
    setNotice(result.ok ? '分類已儲存' : `儲存失敗：${result.error}`);
  };
  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    const trimmed = editing.name.trim();
    if (!trimmed || trimmed.length > 80) { setNotice('分類名稱為必填且最多 80 字'); return; }
    if (categories.some((category) => category.id !== editing.id && category.name.trim().toLocaleLowerCase() === trimmed.toLocaleLowerCase())) { setNotice('分類名稱不可重複'); return; }
    const next = { ...editing, name: trimmed };
    setCategories(categories.map((item) => item.id === next.id ? next : item));
    const result = await saveCategory(next);
    setEditing(null); setNotice(result.ok ? '分類已更新' : `儲存失敗：${result.error}`);
  };
  const remove = async (category: AdminCategory) => {
    if (!confirm(`確定刪除「${category.name}」？使用中的分類會被資料庫拒絕。`)) return;
    const result = await deleteCategory(category);
    if (!result.ok) { setNotice(`刪除失敗：${result.error}`); return; }
    setCategories(categories.filter((item) => item.id !== category.id)); setNotice('分類已刪除');
  };
  return <div className="panel category-manager"><div className="panel-heading"><div><h3>文章分類管理</h3><p className="muted">{loading ? '載入中…' : '使用中的分類無法刪除'}</p></div><div className="tabs"><button type="button" className={type === 'news' ? 'active' : ''} onClick={() => setType('news')}>最新消息</button><button type="button" className={type === 'blog' ? 'active' : ''} onClick={() => setType('blog')}>部落格</button></div></div><form className="category-form" onSubmit={(event) => void add(event)}><input value={name} onChange={(event) => setName(event.target.value)} placeholder="新增分類名稱" /><button className="small-btn"><Plus size={15} />新增分類</button></form>{notice && <p className="muted">{notice}</p>}{editing && <form className="category-edit-form" onSubmit={(event) => void saveEdit(event)}><input aria-label="編輯分類名稱" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /><button className="small-btn">儲存</button><button type="button" className="text-btn" onClick={() => setEditing(null)}>取消</button></form>}<div className="category-chips">{visible.map((category) => <span key={category.id}>{category.name}<button type="button" aria-label={`編輯 ${category.name}`} onClick={() => setEditing(category)}>編輯</button><button type="button" aria-label={`刪除 ${category.name}`} onClick={() => void remove(category)}>×</button></span>)}</div></div>;
}

function MediaEditor() {
  const [files, setFiles, loading] = useStored<AdminMedia[]>('txg-media', seedMedia, loadMedia); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [keyword, setKeyword] = useState(''); const [mimeFilter, setMimeFilter] = useState<'all' | 'image/jpeg' | 'image/png' | 'image/webp'>('all');
  const filteredFiles = files.filter((file) => (!keyword.trim() || `${file.name} ${file.alt}`.toLowerCase().includes(keyword.trim().toLowerCase())) && (mimeFilter === 'all' || file.mimeType === mimeFilter));
  const addFile = async (file: File) => { setError(''); const result = await uploadMedia(file); if (result.ok) { const next: AdminMedia = { id: 'id' in result && result.id ? result.id : `local-${Date.now()}`, name: file.name, url: result.url, alt: '', mimeType: file.type, size: file.size, width: 'width' in result ? result.width : undefined, height: 'height' in result ? result.height : undefined }; setFiles([next, ...files]); setNotice('素材已上傳'); } else setError(result.error || '上傳失敗'); };
  const updateAlt = async (file: AdminMedia, alt: string) => { const normalizedAlt = alt.trim().slice(0, 160); setError(''); setFiles(files.map((item) => item.id === file.id ? { ...item, alt: normalizedAlt } : item)); if (adminSupabase && !file.id.startsWith('local-')) { const result = await saveMediaAlt(file.id, normalizedAlt); if (!result.ok) { setError(`替代文字儲存失敗：${result.error}`); return; } } setNotice('替代文字已儲存'); };
  const remove = async (file: AdminMedia) => { if (!window.confirm(`確定刪除「${file.name}」？正在使用的素材會由資料庫拒絕刪除。`)) return; const result = await deleteMedia(file); if (!result.ok) { setError(`刪除失敗：${result.error}`); return; } setFiles(files.filter((item) => item.id !== file.id)); setNotice('素材已刪除'); if ('warning' in result && result.warning) setNotice(result.warning); };
  return <div className="panel"><div className="panel-heading"><div><h3>素材管理</h3><p className="muted">支援 JPEG、PNG、WebP，單檔上限 10 MB {loading ? '・載入中…' : ''}</p>{notice && <span className="muted">{notice}</span>}</div><label className="small-btn"><Plus size={15} />上傳素材<input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void addFile(file); event.currentTarget.value = ''; }} /></label></div><div className="media-filters"><input aria-label="搜尋素材" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜尋檔名或替代文字" /><select aria-label="素材格式" value={mimeFilter} onChange={(event) => setMimeFilter(event.target.value as typeof mimeFilter)}><option value="all">全部格式</option><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></div>{error && <p className="error">{error}</p>}<div className="media-grid">{filteredFiles.map((file) => <div className="media-card" key={file.id}><img src={file.url} alt={file.alt} /><strong>{file.name}</strong><small className="media-dimensions">{file.width && file.height ? `${file.width} × ${file.height}px` : '尺寸待讀取'}　{Math.round(file.size / 1024)} KB</small><input aria-label={`${file.name} 替代文字`} defaultValue={file.alt} onBlur={(event) => void updateAlt(file, event.target.value)} placeholder="替代文字" /><button className="text-btn" onClick={(event) => { const input = event.currentTarget.previousElementSibling as HTMLInputElement | null; if (input) void updateAlt(file, input.value); }}>儲存替代文字</button><button className="danger media-delete" type="button" onClick={() => void remove(file)}>刪除素材</button></div>)}</div>{filteredFiles.length === 0 && <p className="empty">沒有符合條件的素材。</p>}</div>;
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

function SettingsEditor({ value, setValue, loading }: { value: typeof seedSettings; setValue: (value: typeof seedSettings) => void; loading: boolean }) {
  const [notice, setNotice] = useState(''); const [dirty, setDirty] = useState(false); const normalized = { ...seedSettings, ...value };
  useUnsavedWarning(dirty, 'settings');
  const update = (key: keyof typeof normalized, next: string) => { setValue({ ...normalized, [key]: next }); setDirty(true); };
  const save = async () => { const validationError = validateSettingsFields(normalized); if (validationError) { setNotice(validationError); return; } const result = await saveSettings(normalized); if (result.ok) setDirty(false); setNotice(result.ok ? '網站設定已儲存' : `儲存失敗：${result.error}`); };
  return <div className="panel form-panel narrow"><div className="panel-heading"><div><h3>網站基本設定</h3><p className="muted">{loading ? '載入中…' : adminSupabase ? '儲存後刷新官網即可看到更新' : '開發模式儲存在此瀏覽器；設定 Supabase 後才會同步官網'} {dirty && <span className="unsaved-indicator">尚未儲存</span>} {notice && `・${notice}`}</p></div><button type="button" className="save-btn" onClick={() => void save()}><Save size={15} />儲存</button></div><FormField label="品牌名稱" value={normalized.brandName} onChange={(next) => update('brandName', next)} /><FormField label="Logo 圖片網址" value={normalized.logoUrl} onChange={(next) => update('logoUrl', next)} /><MediaPicker value={normalized.logoUrl} onChange={(asset) => update('logoUrl', asset.url)} /><FormField label="聯絡電話" value={normalized.phone} onChange={(next) => update('phone', next)} /><FormField label="LINE ID" value={normalized.line} onChange={(next) => update('line', next)} /><FormField label="地址" value={normalized.address} onChange={(next) => update('address', next)} /><FormField label="營業時間" value={normalized.hours} onChange={(next) => update('hours', next)} /><FormField label="地圖 Embed URL" value={normalized.mapEmbedUrl} onChange={(next) => update('mapEmbedUrl', next)} /><div className="two-fields"><FormField label="Instagram URL" value={normalized.instagram} onChange={(next) => update('instagram', next)} /><FormField label="Facebook URL" value={normalized.facebook} onChange={(next) => update('facebook', next)} /></div><FormField label="YouTube URL" value={normalized.youtube} onChange={(next) => update('youtube', next)} /><FormField label="SEO 標題" value={normalized.seoTitle} onChange={(next) => update('seoTitle', next)} /><FormField label="SEO 描述" value={normalized.seoDescription} textarea onChange={(next) => update('seoDescription', next)} /><FormField label="分享圖片網址" value={normalized.ogImageUrl} onChange={(next) => update('ogImageUrl', next)} /><MediaPicker value={normalized.ogImageUrl} onChange={(asset) => update('ogImageUrl', asset.url)} /><FormField label="隱私權政策" value={normalized.privacy} textarea onChange={(next) => update('privacy', next)} /><FormField label="服務條款" value={normalized.terms} textarea onChange={(next) => update('terms', next)} /><div className="notice">第一版固定版型只開放內容欄位編輯。背景、Logo 與分享圖可填入素材管理產生的網址，正式地圖網址請在上線前確認。</div></div>;
}

function HomeContentEditor({ value, setValue }: { value: typeof seedSettings; setValue: (value: typeof seedSettings) => void }) {
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
    <div className="home-editor-section"><h4>主視覺</h4><div className="two-fields"><FormField label="主標題" value={normalized.heroTitle} onChange={(next) => update('heroTitle', next)} /><FormField label="副標題" value={normalized.heroSubtitle} onChange={(next) => update('heroSubtitle', next)} /></div><FormField label="標語" value={normalized.tagline} onChange={(next) => update('tagline', next)} /><FormField label="說明文字" value={normalized.heroDescription} onChange={(next) => update('heroDescription', next)} /><FormField label="背景圖片網址" value={normalized.heroBackgroundUrl} onChange={(next) => update('heroBackgroundUrl', next)} /><MediaPicker value={normalized.heroBackgroundUrl} onChange={(asset) => update('heroBackgroundUrl', asset.url)} /></div>
    <div className="home-editor-section"><h4>服務與價格</h4><div className="two-fields"><FormField label="服務標題" value={normalized.servicesTitle} onChange={(next) => update('servicesTitle', next)} /><FormField label="服務副標題" value={normalized.servicesSubtitle} onChange={(next) => update('servicesSubtitle', next)} /></div><FormField label="服務說明" value={normalized.servicesNote} textarea onChange={(next) => update('servicesNote', next)} /><FormField label="服務區背景圖片網址" value={normalized.servicesBackgroundUrl} onChange={(next) => update('servicesBackgroundUrl', next)} /><MediaPicker value={normalized.servicesBackgroundUrl} onChange={(asset) => update('servicesBackgroundUrl', asset.url)} /><div className="two-fields"><FormField label="價格標題" value={normalized.pricingTitle} onChange={(next) => update('pricingTitle', next)} /><FormField label="價格副標題" value={normalized.pricingSubtitle} onChange={(next) => update('pricingSubtitle', next)} /></div><FormField label="價格區背景圖片網址" value={normalized.pricingBackgroundUrl} onChange={(next) => update('pricingBackgroundUrl', next)} /><MediaPicker value={normalized.pricingBackgroundUrl} onChange={(asset) => update('pricingBackgroundUrl', asset.url)} /></div>
    <div className="home-editor-section"><h4>消息與部落格</h4><div className="two-fields"><FormField label="消息標題" value={normalized.newsTitle} onChange={(next) => update('newsTitle', next)} /><FormField label="消息副標題" value={normalized.newsSubtitle} onChange={(next) => update('newsSubtitle', next)} /></div><FormField label="消息區背景圖片網址" value={normalized.newsBackgroundUrl} onChange={(next) => update('newsBackgroundUrl', next)} /><MediaPicker value={normalized.newsBackgroundUrl} onChange={(asset) => update('newsBackgroundUrl', asset.url)} /><div className="two-fields"><FormField label="部落格標題" value={normalized.blogTitle} onChange={(next) => update('blogTitle', next)} /><FormField label="部落格副標題" value={normalized.blogSubtitle} onChange={(next) => update('blogSubtitle', next)} /></div><FormField label="部落格區背景圖片網址" value={normalized.blogBackgroundUrl} onChange={(next) => update('blogBackgroundUrl', next)} /><MediaPicker value={normalized.blogBackgroundUrl} onChange={(asset) => update('blogBackgroundUrl', asset.url)} /></div>
    <div className="home-editor-section"><h4>聯繫區與特色列</h4><div className="two-fields"><FormField label="聯繫標題" value={normalized.contactTitle} onChange={(next) => update('contactTitle', next)} /><FormField label="聯繫副標題" value={normalized.contactLead} onChange={(next) => update('contactLead', next)} /></div><FormField label="聯繫區背景圖片網址" value={normalized.contactBackgroundUrl} onChange={(next) => update('contactBackgroundUrl', next)} /><MediaPicker value={normalized.contactBackgroundUrl} onChange={(asset) => update('contactBackgroundUrl', asset.url)} /><FormField label="消息特色列 JSON（title/caption）" value={benefitsRaw} textarea onChange={(raw) => updateBenefits('news', raw)} /><FormField label="價格信任列 JSON（title/caption）" value={pricingBenefitsRaw} textarea onChange={(raw) => updateBenefits('pricing', raw)} /></div>
    <div className="notice">圖片可先使用素材管理中的網址。兩組特色列都只接受 JSON 陣列，每筆格式為 <code>{'{"title":"標題","caption":"說明"}'}</code>。{adminSupabase ? ' 儲存後重新整理官網即可同步。' : ' 開發模式只保存於此瀏覽器，正式同步需設定 Supabase。'}</div>
  </div>;
}

type AdminWindow = Window & { __tianXingeAdminRoot?: Root };
const adminWindow = window as AdminWindow;
const adminRoot = adminWindow.__tianXingeAdminRoot ?? createRoot(document.getElementById('root')!);
adminWindow.__tianXingeAdminRoot = adminRoot;
adminRoot.render(<BrowserRouter><App /></BrowserRouter>);
