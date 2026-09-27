import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink, FolderCog, Pencil, Plus, Save, Trash2, Upload } from 'lucide-react';
import { articleBodyTextLength, createContentCode, isPublicSlug, isPublishableArticleBody, isSafeContentUrl, isValidArticleBody, isValidArticleSources, normalizeYouTubeEmbedUrl, type Article, type ArticleTextRun } from '@tian-xin-ge/contracts';
import { CoverImagePicker } from '../../components/CoverImagePicker';
import { RichTextEditor } from '../../components/RichTextEditor';
import { MediaUploadProgress, type MediaUploadProgressState } from '../../components/MediaUploadProgress';
import { resolveMediaUrl } from '../../lib/media-url';
import { deleteArticle, deleteCategory, saveArticle, saveCategory, uploadMedia, type AdminCategory, type AdminMedia, type ManagedArticle, type MediaUploadProgress as UploadProgressValue } from '../../repositories';

type Props = {
  type: 'news' | 'blog';
  values: ManagedArticle[];
  setValues: (values: ManagedArticle[]) => void;
  loading: boolean;
  media: AdminMedia[];
  setMedia: (values: AdminMedia[]) => void;
  categories: AdminCategory[];
  setCategories: (values: AdminCategory[]) => void;
  categoriesLoading: boolean;
  webOrigin: string;
  remoteEnabled: boolean;
  onDirtyChange: (dirty: boolean) => void;
};

const labels = { news: '最新消息', blog: '部落格' } as const;
const statusLabels = { draft: '草稿', scheduled: '排程中', published: '已發布' } as const;

function taipeiLocalValue(iso?: string | null) {
  if (!iso || Number.isNaN(Date.parse(iso))) return '';
  return new Date(Date.parse(iso) + 8 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

function taipeiLocalToIso(value: string) {
  return value ? new Date(`${value}:00+08:00`).toISOString() : null;
}

function articleQualityWarnings(article: ManagedArticle): string[] {
  if (article.status === 'draft') return [];
  let body: unknown;
  try { body = JSON.parse(article.body || '[]'); } catch { body = []; }
  const warnings: string[] = [];
  const textLength = articleBodyTextLength(body);
  if (textLength < 120) warnings.push(`正文約 ${textLength} 字，建議補充至 120 字以上`);
  if (!article.excerpt.trim()) warnings.push('摘要尚未填寫');
  if (!article.seoDescription?.trim()) warnings.push('SEO 描述尚未填寫，將使用摘要作為 fallback');
  if (!article.authorName?.trim()) warnings.push('作者／編輯名稱尚未填寫，將使用網站編輯團隊');
  if (article.coverUrl && !article.coverAlt?.trim()) warnings.push('封面替代文字尚未填寫');
  return warnings;
}

function InlineText({ runs, fallback }: { runs?: ArticleTextRun[]; fallback: string }) {
  if (!runs?.length) return fallback;
  return runs.map((run, index) => {
    const style = { color: run.color, fontSize: run.fontSize, fontFamily: run.fontFamily, fontWeight: run.bold ? 700 : undefined, fontStyle: run.italic ? 'italic' : undefined, textDecoration: [run.underline && 'underline', run.strike && 'line-through'].filter(Boolean).join(' ') || undefined };
    const content = <span style={style}>{run.text}</span>;
    return run.href ? <a key={index} href={run.href} target="_blank" rel="noreferrer">{content}</a> : <span key={index}>{content}</span>;
  });
}

function ArticleBodyPreview({ raw, webOrigin }: { raw: string; webOrigin: string }) {
  let blocks: Article['body'] = [];
  try { const parsed = JSON.parse(raw || '[]'); if (isValidArticleBody(parsed)) blocks = parsed; } catch { /* Invalid content is reported when saving. */ }
  return <div className="preview-body">{blocks.map((block, index) => {
    const style = { textAlign: block.textAlign };
    if (block.type === 'heading') { const Heading = block.level === 3 ? 'h3' : 'h2'; return <Heading key={index} style={style}><InlineText runs={block.content} fallback={block.text} /></Heading>; }
    if (block.type === 'list') { const List = block.ordered ? 'ol' : 'ul'; return <List key={index}>{(block.items ?? []).map((item, itemIndex) => <li key={itemIndex}><InlineText runs={block.itemContent?.[itemIndex]} fallback={item} /></li>)}</List>; }
    if (block.type === 'quote') return <blockquote key={index} style={style}><InlineText runs={block.content} fallback={block.text} /></blockquote>;
    if (block.type === 'image') return <figure key={index}><img src={resolveMediaUrl(block.url ?? '', webOrigin)} alt={block.alt || block.text} /><figcaption>{block.text}</figcaption></figure>;
    if (block.type === 'video') { const youtubeUrl = block.videoKind === 'youtube' ? normalizeYouTubeEmbedUrl(block.url) : null; return <figure className="preview-video" key={index}>{youtubeUrl ? <div className="preview-video-frame"><iframe src={youtubeUrl} title={block.text || 'YouTube 影片'} allowFullScreen /></div> : <video src={resolveMediaUrl(block.url ?? '', webOrigin)} controls preload="metadata" playsInline />}{block.text && <figcaption>{block.text}</figcaption>}</figure>; }
    if (block.type === 'link') return <p key={index} style={style}><a href={block.url} target="_blank" rel="noreferrer">{block.text}</a></p>;
    return <p key={index} style={style}><InlineText runs={block.content} fallback={block.text} /></p>;
  })}</div>;
}

function Preview({ article, webOrigin, onClose }: { article: ManagedArticle; webOrigin: string; onClose: () => void }) {
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [onClose]);
  return <div className="preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="preview-modal" role="dialog" aria-modal="true" aria-label="文章預覽"><header className="preview-header"><div><span className="eyebrow">{statusLabels[article.status]}預覽</span><strong>{labels[article.type]}</strong></div><button type="button" className="icon-btn" aria-label="關閉預覽" onClick={onClose}>×</button></header><article className="preview-article"><span className="preview-category">{article.category}</span><h1>{article.title || '未命名文章'}</h1>{article.excerpt && <p className="preview-excerpt">{article.excerpt}</p>}{article.coverUrl && <img src={resolveMediaUrl(article.coverUrl, webOrigin)} alt="" className="preview-cover" />}<ArticleBodyPreview raw={article.body} webOrigin={webOrigin} /></article></section></div>;
}

function CategoryManagement({ type, values, setValues, loading, articles, onClose }: { type: Props['type']; values: AdminCategory[]; setValues: Props['setCategories']; loading: boolean; articles: ManagedArticle[]; onClose: () => void }) {
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [notice, setNotice] = useState('');
  const visible = values.filter((category) => category.type === type);
  const validate = (category: AdminCategory) => {
    const trimmed = category.name.trim();
    if (!trimmed || trimmed.length > 120) return '分類名稱為必填且最多 120 字';
    if (category.description && category.description.length > 2_000) return '分類介紹最多 2,000 字';
    if (category.seoTitle && category.seoTitle.length > 160) return 'SEO 標題最多 160 字';
    if (category.seoDescription && category.seoDescription.length > 300) return 'SEO 描述最多 300 字';
    if (values.some((item) => item.id !== category.id && item.type === type && item.name.trim().toLowerCase() === trimmed.toLowerCase())) return '分類名稱不可重複';
    return null;
  };
  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: AdminCategory = { id: `local-${Date.now()}`, name: name.trim(), type, description: '', seoTitle: '', seoDescription: '' };
    const error = validate(next);
    if (error) { setNotice(error); return; }
    const result = await saveCategory(next);
    if (!result.ok) { setNotice(`儲存失敗：${result.error}`); return; }
    setValues([...values, { ...next, id: result.id || next.id }]);
    setName('');
    setNotice('分類已儲存');
  };
  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    const next = { ...editing, name: editing.name.trim(), description: editing.description?.trim() || '', seoTitle: editing.seoTitle?.trim() || '', seoDescription: editing.seoDescription?.trim() || '' };
    const error = validate(next);
    if (error) { setNotice(error); return; }
    const result = await saveCategory(next);
    if (!result.ok) { setNotice(`儲存失敗：${result.error}`); return; }
    setValues(values.map((item) => item.id === next.id ? next : item));
    setEditing(null);
    setNotice('分類已更新');
  };
  const remove = async (category: AdminCategory) => { if (articles.some((article) => article.type === type && article.category === category.name)) { setNotice('使用中的分類無法刪除'); return; } if (!window.confirm(`確定刪除「${category.name}」？`)) return; const result = await deleteCategory(category); if (result.ok) setValues(values.filter((item) => item.id !== category.id)); setNotice(result.ok ? '分類已刪除' : `刪除失敗：${result.error}`); };
  return <section className="panel category-manager article-full-panel"><div className="panel-heading"><div><button type="button" className="back-btn" onClick={onClose}><ArrowLeft size={16} />返回{labels[type]}清單</button><h3>{labels[type]}分類管理</h3><p className="muted">這裡只顯示{labels[type]}分類；使用中的分類無法刪除。</p></div></div><form className="category-form" onSubmit={(event) => void add(event)}><input aria-label="新增分類名稱" value={name} onChange={(event) => setName(event.target.value)} placeholder="新增分類名稱" /><button className="small-btn"><Plus size={15} />新增分類</button></form>{loading && <p className="muted">載入中…</p>}{notice && <p className="form-notice" role="status">{notice}</p>}{editing && <form className="category-edit-form" onSubmit={(event) => void saveEdit(event)}><label className="field"><span>分類名稱</span><input aria-label="編輯分類名稱" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></label><label className="field"><span>分類介紹（最多 2,000 字）</span><textarea aria-label="分類介紹" rows={4} maxLength={2000} value={editing.description || ''} onChange={(event) => setEditing({ ...editing, description: event.target.value })} /></label><label className="field"><span>SEO 標題（最多 160 字）</span><input aria-label="分類 SEO 標題" maxLength={160} value={editing.seoTitle || ''} onChange={(event) => setEditing({ ...editing, seoTitle: event.target.value })} /></label><label className="field"><span>SEO 描述（最多 300 字）</span><textarea aria-label="分類 SEO 描述" rows={3} maxLength={300} value={editing.seoDescription || ''} onChange={(event) => setEditing({ ...editing, seoDescription: event.target.value })} /></label><div><button className="small-btn">儲存</button><button type="button" className="text-btn" onClick={() => setEditing(null)}>取消</button></div></form>}<div className="category-chips">{visible.map((category) => <span key={category.id}><strong>{category.name}</strong><span className="category-row-actions"><button type="button" aria-label={`編輯 ${category.name}`} onClick={() => setEditing(category)}>編輯</button><button type="button" aria-label={`刪除 ${category.name}`} onClick={() => void remove(category)}>刪除</button></span></span>)}</div></section>;
}

export function ArticleManagement(props: Props) {
  const { type, values, setValues, loading, media, setMedia, categories, setCategories, categoriesLoading, webOrigin, remoteEnabled, onDirtyChange } = props;
  const [mode, setMode] = useState<'list' | 'edit' | 'categories'>('list');
  const [selectedId, setSelectedId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'scheduled' | 'published'>('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [choosingCover, setChoosingCover] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverUploadProgress, setCoverUploadProgress] = useState<MediaUploadProgressState | null>(null);
  const [sourcesDraft, setSourcesDraft] = useState('[]');
  const pageSize = 10;
  const filtered = useMemo(() => values.filter((item) => item.type === type && (statusFilter === 'all' || item.status === statusFilter) && (!keyword.trim() || `${item.title} ${item.excerpt} ${item.category}`.toLowerCase().includes(keyword.trim().toLowerCase()))), [values, type, statusFilter, keyword]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const selected = values.find((item) => item.id === selectedId && item.type === type);
  const visibleCategories = categories.filter((category) => category.type === type);
  useEffect(() => { setMode('list'); setSelectedId(''); setPage(1); setDirty(false); }, [type]);
  useEffect(() => { setSourcesDraft(JSON.stringify(selected?.sources ?? [], null, 2)); }, [selectedId]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  useEffect(() => { onDirtyChange(dirty); const warn = (event: BeforeUnloadEvent) => { if (!dirty) return; event.preventDefault(); event.returnValue = ''; }; window.addEventListener('beforeunload', warn); return () => { window.removeEventListener('beforeunload', warn); onDirtyChange(false); }; }, [dirty, onDirtyChange]);
  const leaveEditor = () => { if (dirty && !window.confirm('有尚未儲存的文章變更，確定要返回清單嗎？')) return; setDirty(false); setNotice(''); setMode('list'); };
  const edit = (id: string) => { setSelectedId(id); setDirty(false); setNotice(''); setMode('edit'); };
  const add = () => { const next: ManagedArticle = { id: `local-${Date.now()}`, slug: createContentCode(), title: '新文章', category: visibleCategories[0]?.name || (type === 'news' ? '活動訊息' : '養生知識'), status: 'draft', excerpt: '', type, body: '[]', coverUrl: remoteEnabled ? '' : type === 'news' ? '/assets/crops/news-1.png' : '/assets/crops/blog-1.png' }; setValues([...values, next]); setSelectedId(next.id); setDirty(true); setMode('edit'); };
  const update = <K extends keyof ManagedArticle>(key: K, value: ManagedArticle[K]) => { if (!selected) return; setValues(values.map((item) => item.id === selected.id ? { ...item, [key]: value } : item)); setDirty(true); };
  const save = async () => { if (!selected?.title.trim()) { setNotice('標題為必填'); return; } if (selected.title.length > 160 || selected.excerpt.length > 1000 || (selected.coverAlt || '').length > 160) { setNotice('標題最多 160 字、摘要最多 1000 字、封面替代文字最多 160 字'); return; } const slug = selected.slug.trim().toLowerCase(); if (!isPublicSlug(slug)) { setNotice('網址代稱只能使用英文小寫、數字與連字號，最多 80 字'); return; } if (values.some((item) => item.id !== selected.id && item.slug === slug)) { setNotice('這個網址代稱已被其他文章使用'); return; } if (selected.coverUrl && !isSafeContentUrl(selected.coverUrl, true)) { setNotice('封面圖片格式不正確'); return; } let body: unknown; try { body = JSON.parse(selected.body || '[]'); } catch { setNotice('正文格式不正確'); return; } if (!isValidArticleBody(body)) { setNotice('正文包含不支援或不安全的格式'); return; } if (selected.status !== 'draft' && !isPublishableArticleBody(body)) { setNotice('文章必須先提供正文內容才能發布或排程'); return; } if (selected.status === 'scheduled' && (!selected.scheduledAt || Date.parse(selected.scheduledAt) <= Date.now())) { setNotice('請選擇晚於目前時間的排程發布時間'); return; } let sources: unknown; try { sources = JSON.parse(sourcesDraft || '[]'); } catch { setNotice('參考來源必須是合法 JSON 陣列'); return; } if (!isValidArticleSources(sources)) { setNotice('參考來源必須是 HTTPS 網址的 JSON 陣列（最多 10 筆）'); return; } const prepared = { ...selected, slug, sources, scheduledAt: selected.status === 'scheduled' ? selected.scheduledAt : null }; const result = await saveArticle(prepared); if (!result.ok) { setNotice(`儲存失敗：${result.error}`); return; } const savedId = result.id || prepared.id; setValues(values.map((item) => item.id === selected.id ? { ...prepared, id: savedId, version: result.version } : item)); setSelectedId(savedId); setSourcesDraft(JSON.stringify(sources, null, 2)); setDirty(false); const warnings = articleQualityWarnings(prepared); setNotice(warnings.length ? `文章已儲存；SEO 提醒：${warnings.join('、')}` : '文章已儲存'); };
  const remove = async () => { if (!selected || !window.confirm(`確定刪除「${selected.title}」？`)) return; const result = await deleteArticle(selected.id); if (!result.ok) { setNotice(`刪除失敗：${result.error}`); return; } setValues(values.filter((item) => item.id !== selected.id)); setDirty(false); setMode('list'); setNotice('文章已刪除'); };
  const uploadCover = async (file: File) => {
    if (!selected) return;
    setUploadingCover(true); setNotice(''); setCoverUploadProgress({ fileName: file.name, loaded: 0, total: file.size, percent: 0, phase: 'uploading' });
    try {
      const result = await uploadMedia(file, selected.title, (progress) => setCoverUploadProgress({ fileName: file.name, ...progress }));
      if (!result.ok) { setNotice(`封面上傳失敗：${result.error}`); return; }
      const next: AdminMedia = { id: 'id' in result && result.id ? result.id : `local-${Date.now()}`, name: 'name' in result && result.name ? result.name : file.name, url: result.url, alt: selected.title, mimeType: 'mimeType' in result && result.mimeType ? result.mimeType : file.type, size: 'size' in result && typeof result.size === 'number' ? result.size : file.size, storagePath: 'storagePath' in result ? result.storagePath : undefined, width: 'width' in result && typeof result.width === 'number' ? result.width : undefined, height: 'height' in result && typeof result.height === 'number' ? result.height : undefined };
      setMedia([next, ...media]);
      setValues(values.map((item) => item.id === selected.id ? { ...item, coverUrl: result.url, coverAlt: item.coverAlt || selected.title } : item));
      setDirty(true); setNotice('封面圖片已上傳並選用');
    } finally { setUploadingCover(false); setCoverUploadProgress(null); }
  };
  const uploadArticleMedia = async (file: File, onProgress?: (progress: UploadProgressValue) => void): Promise<AdminMedia> => {
    const result = await uploadMedia(file, selected?.title || '文章媒體', onProgress);
    if (!result.ok) throw new Error(`上傳失敗：${result.error}`);
    const next: AdminMedia = { id: 'id' in result && result.id ? result.id : `local-${Date.now()}`, name: 'name' in result && result.name ? result.name : file.name, url: result.url, alt: selected?.title || file.name, mimeType: 'mimeType' in result && result.mimeType ? result.mimeType : file.type, size: 'size' in result && typeof result.size === 'number' ? result.size : file.size, storagePath: 'storagePath' in result ? result.storagePath : undefined, width: 'width' in result && typeof result.width === 'number' ? result.width : undefined, height: 'height' in result && typeof result.height === 'number' ? result.height : undefined };
    setMedia([next, ...media]);
    return next;
  };

  if (mode === 'categories') return <CategoryManagement type={type} values={categories} setValues={setCategories} loading={categoriesLoading} articles={values} onClose={() => setMode('list')} />;
  if (mode === 'list') return <section className="panel article-list-page article-full-panel"><div className="panel-heading article-list-heading"><div><h3>{labels[type]}文章管理</h3><p className="muted">共 {filtered.length} 篇，點擊編輯後才會進入文章編輯畫面。</p></div><div className="editor-actions"><button type="button" className="secondary-btn" onClick={() => setMode('categories')}><FolderCog size={16} />編輯分類</button><button type="button" className="small-btn" onClick={add}><Plus size={15} />新增文章</button></div></div>{notice && <p className="form-notice" role="status">{notice}</p>}<div className="article-filters article-list-filters"><input aria-label={`搜尋${labels[type]}文章`} placeholder="搜尋標題、摘要或分類" value={keyword} onChange={(event) => { setKeyword(event.target.value); setPage(1); }} /><select aria-label="文章狀態" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as typeof statusFilter); setPage(1); }}><option value="all">全部狀態</option><option value="scheduled">排程中</option><option value="published">已發布</option><option value="draft">草稿</option></select></div>{loading ? <p className="muted">載入中…</p> : pageItems.length === 0 ? <p className="empty">目前沒有符合條件的{labels[type]}文章。</p> : <div className="article-admin-table"><div className="article-admin-row article-admin-head"><span>文章標題</span><span>分類</span><span>發布日期</span><span>狀態</span><span>操作</span></div>{pageItems.map((item) => <div className="article-admin-row" key={item.id}><span><strong>{item.title}</strong><small>{item.excerpt || '尚未填寫摘要'}</small></span><span>{item.category}</span><span>{item.status === 'scheduled' ? taipeiLocalValue(item.scheduledAt).replace('T', ' ') : item.publishedAt || '未設定'}</span><span><i className={`status ${item.status}`}>{statusLabels[item.status]}</i></span><span><button type="button" className="text-btn" aria-label={`編輯 ${item.title}`} onClick={() => edit(item.id)}><Pencil size={14} />編輯</button></span></div>)}</div>}{totalPages > 1 && <div className="admin-pagination"><button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>上一頁</button><span>{page} / {totalPages}</span><button type="button" disabled={page === totalPages} onClick={() => setPage(page + 1)}>下一頁</button></div>}</section>;
  if (!selected) return null;
  return <>
    <section className="panel form-panel article-edit-page article-full-panel">
      <div className="panel-heading article-edit-heading">
        <div className="article-edit-title">
          <button type="button" className="back-btn" onClick={leaveEditor}><ArrowLeft size={16} />返回{labels[type]}清單</button>
          <div className="article-title-row">
            <h3>編輯{labels[type]}文章</h3>
            <label className="publish-status"><span>文章狀態</span><select aria-label="文章狀態" value={selected.status} onChange={(event) => update('status', event.target.value as ManagedArticle['status'])}><option value="draft">草稿</option><option value="scheduled">排程中</option><option value="published">立即發布</option></select></label>
            {dirty && <span className="unsaved-indicator">尚未儲存</span>}
          </div>
          {notice && <span className="form-notice" role="status">{notice}</span>}
        </div>
        <div className="editor-actions article-primary-actions">
          <button type="button" className="secondary-btn article-action-button" onClick={() => setPreviewing(true)}><ExternalLink size={15} />預覽</button>
          <button type="button" className="save-btn article-action-button" onClick={() => void save()}><Save size={15} />儲存</button>
          <button type="button" className="danger article-action-button article-delete-button" onClick={() => void remove()}><Trash2 size={15} />刪除文章</button>
        </div>
      </div>
      <label className="field"><span>文章標題</span><input aria-label="文章標題" value={selected.title} onChange={(event) => update('title', event.target.value)} /></label>
      <label className="field"><span>網址代稱</span><input aria-label="文章網址代稱" maxLength={80} value={selected.slug} onChange={(event) => update('slug', event.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder={type === 'news' ? '例如：autumn-special-offer' : '例如：foot-massage-guide'} /><small className="muted">只能使用英文小寫、數字與連字號；修改後舊網址會自動轉址。</small></label>
      <label className="field"><span>分類</span><select aria-label="分類" value={selected.category} onChange={(event) => update('category', event.target.value)}>{visibleCategories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}{!visibleCategories.some((category) => category.name === selected.category) && <option value={selected.category}>{selected.category}</option>}</select></label>
      <label className="field"><span>發布日期</span><input aria-label="發布日期" type="date" value={selected.publishedAt || new Date().toISOString().slice(0, 10)} onChange={(event) => update('publishedAt', event.target.value)} /></label>
      {selected.status === 'scheduled' && <label className="field"><span>排程發布時間（台北時間）</span><input aria-label="排程發布時間" type="datetime-local" value={taipeiLocalValue(selected.scheduledAt)} onChange={(event) => { const scheduledAt = taipeiLocalToIso(event.target.value); setValues(values.map((item) => item.id === selected.id ? { ...item, scheduledAt, ...(event.target.value ? { publishedAt: event.target.value.slice(0, 10) } : {}) } : item)); setDirty(true); }} /><small className="muted">系統會在設定時間到達後自動發布；網站重建通常還需數分鐘。</small></label>}
      <label className="field"><span>摘要</span><textarea aria-label="摘要" value={selected.excerpt} onChange={(event) => update('excerpt', event.target.value)} /></label>
      <label className="field"><span>作者／編輯名稱（選填）</span><input aria-label="作者／編輯名稱" maxLength={160} value={selected.authorName || ''} onChange={(event) => update('authorName', event.target.value)} placeholder="未填寫時使用網站編輯團隊" /></label>
      <div className="two-fields"><label className="field"><span>SEO 標題</span><input value={selected.seoTitle || ''} onChange={(event) => update('seoTitle', event.target.value)} /></label><label className="field"><span>SEO 描述</span><input value={selected.seoDescription || ''} onChange={(event) => update('seoDescription', event.target.value)} /></label></div>
      <div className="two-fields"><label className="field"><span>內容更新日期（自動）</span><input aria-label="內容更新日期" type="date" value={selected.contentUpdatedAt?.slice(0, 10) || ''} readOnly /><small className="muted">標題、摘要、正文、封面或來源有實質變更時由伺服器自動更新。</small></label><label className="field"><span>參考來源 JSON</span><textarea aria-label="參考來源 JSON" value={sourcesDraft} onChange={(event) => { setSourcesDraft(event.target.value); setDirty(true); }} placeholder='[{"title":"來源名稱","url":"https://example.com/page"}]' /></label></div>
      <div className="field cover-field"><div className="cover-field-heading"><span>封面圖片</span><div className="cover-image-actions"><button type="button" className="secondary-btn" disabled={uploadingCover} onClick={() => setChoosingCover(true)}>選擇封面圖片</button><label className="secondary-btn cover-upload-btn"><Upload size={15} />{uploadingCover ? `上傳中 ${coverUploadProgress?.percent ?? 0}%` : '上傳封面圖片'}<input aria-label="上傳封面圖片" hidden disabled={uploadingCover} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadCover(file); event.currentTarget.value = ''; }} /></label></div></div><MediaUploadProgress value={coverUploadProgress} />{selected.coverUrl && <img className="selected-cover-preview" src={resolveMediaUrl(selected.coverUrl, webOrigin)} alt="目前封面" />}<label className="field"><span>封面圖片替代文字</span><input aria-label="封面圖片替代文字" value={selected.coverAlt || ''} onChange={(event) => update('coverAlt', event.target.value)} placeholder="具體描述圖片內容" /></label></div>

      <RichTextEditor value={selected.body} onChange={(value) => update('body', value)} media={media} webOrigin={webOrigin} onUploadMedia={uploadArticleMedia} />
      {articleQualityWarnings(selected).length > 0 && <p className="form-notice seo-quality-warning" role="status">SEO 提醒：{articleQualityWarnings(selected).join('、')}</p>}
    </section>
    {choosingCover && <CoverImagePicker media={media} value={selected.coverUrl || ''} webOrigin={webOrigin} onClose={() => setChoosingCover(false)} onSelect={(file) => { setValues(values.map((item) => item.id === selected.id ? { ...item, coverUrl: file.url, coverAlt: file.alt || item.coverAlt || selected.title } : item)); setDirty(true); setChoosingCover(false); }} />}
    {previewing && <Preview article={selected} webOrigin={webOrigin} onClose={() => setPreviewing(false)} />}
  </>;
}
