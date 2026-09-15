import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink, FolderCog, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { createContentCode, isContentCode, isPublishableArticleBody, isSafeContentUrl, isValidArticleBody, type Article, type ArticleTextRun } from '@tian-xin-ge/contracts';
import { RichTextEditor } from '../../components/RichTextEditor';
import { resolveMediaUrl } from '../../lib/media-url';
import { deleteArticle, deleteCategory, saveArticle, saveCategory, type AdminCategory, type AdminMedia, type ManagedArticle } from '../../repositories';

type Props = {
  type: 'news' | 'blog';
  values: ManagedArticle[];
  setValues: (values: ManagedArticle[]) => void;
  loading: boolean;
  media: AdminMedia[];
  categories: AdminCategory[];
  setCategories: (values: AdminCategory[]) => void;
  categoriesLoading: boolean;
  webOrigin: string;
  remoteEnabled: boolean;
  onDirtyChange: (dirty: boolean) => void;
};

const labels = { news: '最新消息', blog: '部落格' } as const;

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
    if (block.type === 'heading') return <h2 key={index} style={style}><InlineText runs={block.content} fallback={block.text} /></h2>;
    if (block.type === 'list') { const List = block.ordered ? 'ol' : 'ul'; return <List key={index}>{(block.items ?? []).map((item, itemIndex) => <li key={itemIndex}><InlineText runs={block.itemContent?.[itemIndex]} fallback={item} /></li>)}</List>; }
    if (block.type === 'quote') return <blockquote key={index} style={style}><InlineText runs={block.content} fallback={block.text} /></blockquote>;
    if (block.type === 'image') return <figure key={index}><img src={resolveMediaUrl(block.url ?? '', webOrigin)} alt={block.alt || block.text} /><figcaption>{block.text}</figcaption></figure>;
    if (block.type === 'link') return <p key={index} style={style}><a href={block.url} target="_blank" rel="noreferrer">{block.text}</a></p>;
    return <p key={index} style={style}><InlineText runs={block.content} fallback={block.text} /></p>;
  })}</div>;
}

function Preview({ article, webOrigin, onClose }: { article: ManagedArticle; webOrigin: string; onClose: () => void }) {
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [onClose]);
  return <div className="preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="preview-modal" role="dialog" aria-modal="true" aria-label="文章預覽"><header className="preview-header"><div><span className="eyebrow">{article.status === 'published' ? '已發布預覽' : '草稿預覽'}</span><strong>{labels[article.type]}</strong></div><button type="button" className="icon-btn" aria-label="關閉預覽" onClick={onClose}>×</button></header><article className="preview-article"><span className="preview-category">{article.category}</span><h1>{article.title || '未命名文章'}</h1>{article.excerpt && <p className="preview-excerpt">{article.excerpt}</p>}{article.coverUrl && <img src={resolveMediaUrl(article.coverUrl, webOrigin)} alt="" className="preview-cover" />}<ArticleBodyPreview raw={article.body} webOrigin={webOrigin} /></article></section></div>;
}

function CategoryManagement({ type, values, setValues, loading, articles, onClose }: { type: Props['type']; values: AdminCategory[]; setValues: Props['setCategories']; loading: boolean; articles: ManagedArticle[]; onClose: () => void }) {
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [notice, setNotice] = useState('');
  const visible = values.filter((category) => category.type === type);
  const add = async (event: React.FormEvent) => { event.preventDefault(); const trimmed = name.trim(); if (!trimmed || trimmed.length > 80) { setNotice('分類名稱為必填且最多 80 字'); return; } if (values.some((category) => category.type === type && category.name.toLowerCase() === trimmed.toLowerCase())) { setNotice('分類名稱不可重複'); return; } const next: AdminCategory = { id: `local-${Date.now()}`, name: trimmed, type }; setValues([...values, next]); setName(''); const result = await saveCategory(next); if (result.ok && result.id) setValues([...values, { ...next, id: result.id }]); setNotice(result.ok ? '分類已儲存' : `儲存失敗：${result.error}`); };
  const saveEdit = async (event: React.FormEvent) => { event.preventDefault(); if (!editing) return; const trimmed = editing.name.trim(); if (!trimmed || trimmed.length > 80) { setNotice('分類名稱為必填且最多 80 字'); return; } if (values.some((category) => category.id !== editing.id && category.type === type && category.name.toLowerCase() === trimmed.toLowerCase())) { setNotice('分類名稱不可重複'); return; } const next = { ...editing, name: trimmed }; const result = await saveCategory(next); if (result.ok) setValues(values.map((item) => item.id === next.id ? next : item)); setEditing(null); setNotice(result.ok ? '分類已更新' : `儲存失敗：${result.error}`); };
  const remove = async (category: AdminCategory) => { if (articles.some((article) => article.type === type && article.category === category.name)) { setNotice('使用中的分類無法刪除'); return; } if (!window.confirm(`確定刪除「${category.name}」？`)) return; const result = await deleteCategory(category); if (result.ok) setValues(values.filter((item) => item.id !== category.id)); setNotice(result.ok ? '分類已刪除' : `刪除失敗：${result.error}`); };
  return <section className="panel category-manager article-full-panel"><div className="panel-heading"><div><button type="button" className="back-btn" onClick={onClose}><ArrowLeft size={16} />返回{labels[type]}清單</button><h3>{labels[type]}分類管理</h3><p className="muted">這裡只顯示{labels[type]}分類；使用中的分類無法刪除。</p></div></div><form className="category-form" onSubmit={(event) => void add(event)}><input aria-label="新增分類名稱" value={name} onChange={(event) => setName(event.target.value)} placeholder="新增分類名稱" /><button className="small-btn"><Plus size={15} />新增分類</button></form>{loading && <p className="muted">載入中…</p>}{notice && <p className="form-notice" role="status">{notice}</p>}{editing && <form className="category-edit-form" onSubmit={(event) => void saveEdit(event)}><input aria-label="編輯分類名稱" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /><button className="small-btn">儲存</button><button type="button" className="text-btn" onClick={() => setEditing(null)}>取消</button></form>}<div className="category-chips">{visible.map((category) => <span key={category.id}><strong>{category.name}</strong><span className="category-row-actions"><button type="button" aria-label={`編輯 ${category.name}`} onClick={() => setEditing(category)}>編輯</button><button type="button" aria-label={`刪除 ${category.name}`} onClick={() => void remove(category)}>刪除</button></span></span>)}</div></section>;
}

export function ArticleManagement(props: Props) {
  const { type, values, setValues, loading, media, categories, setCategories, categoriesLoading, webOrigin, remoteEnabled, onDirtyChange } = props;
  const [mode, setMode] = useState<'list' | 'edit' | 'categories'>('list');
  const [selectedId, setSelectedId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const pageSize = 10;
  const filtered = useMemo(() => values.filter((item) => item.type === type && (statusFilter === 'all' || item.status === statusFilter) && (!keyword.trim() || `${item.title} ${item.excerpt} ${item.category}`.toLowerCase().includes(keyword.trim().toLowerCase()))), [values, type, statusFilter, keyword]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const selected = values.find((item) => item.id === selectedId && item.type === type);
  const visibleCategories = categories.filter((category) => category.type === type);
  useEffect(() => { setMode('list'); setSelectedId(''); setPage(1); setDirty(false); }, [type]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  useEffect(() => { onDirtyChange(dirty); const warn = (event: BeforeUnloadEvent) => { if (!dirty) return; event.preventDefault(); event.returnValue = ''; }; window.addEventListener('beforeunload', warn); return () => { window.removeEventListener('beforeunload', warn); onDirtyChange(false); }; }, [dirty, onDirtyChange]);
  const leaveEditor = () => { if (dirty && !window.confirm('有尚未儲存的文章變更，確定要返回清單嗎？')) return; setDirty(false); setNotice(''); setMode('list'); };
  const edit = (id: string) => { setSelectedId(id); setDirty(false); setNotice(''); setMode('edit'); };
  const add = () => { const next: ManagedArticle = { id: `local-${Date.now()}`, slug: createContentCode(), title: '新文章', category: visibleCategories[0]?.name || (type === 'news' ? '活動訊息' : '養生知識'), status: 'draft', excerpt: '', type, body: '[]', coverUrl: remoteEnabled ? '' : type === 'news' ? '/assets/crops/news-1.png' : '/assets/crops/blog-1.png' }; setValues([...values, next]); setSelectedId(next.id); setDirty(true); setMode('edit'); };
  const update = (key: keyof ManagedArticle, value: string) => { if (!selected) return; setValues(values.map((item) => item.id === selected.id ? { ...item, [key]: value } : item)); setDirty(true); };
  const save = async () => { if (!selected?.title.trim()) { setNotice('標題為必填'); return; } if (selected.title.length > 160 || selected.excerpt.length > 1000) { setNotice('標題最多 160 字、摘要最多 1000 字'); return; } const slug = isContentCode(selected.slug) ? selected.slug : createContentCode(); if (values.some((item) => item.id !== selected.id && item.slug === slug)) { setNotice('系統代碼發生重複，請重新儲存'); return; } if (selected.coverUrl && !isSafeContentUrl(selected.coverUrl, true)) { setNotice('封面圖片格式不正確'); return; } let body: unknown; try { body = JSON.parse(selected.body || '[]'); } catch { setNotice('正文格式不正確'); return; } if (!isValidArticleBody(body)) { setNotice('正文包含不支援或不安全的格式'); return; } if (selected.status === 'published' && !isPublishableArticleBody(body)) { setNotice('文章必須先提供正文內容才能發布'); return; } const prepared = { ...selected, slug }; const result = await saveArticle(prepared); if (!result.ok) { setNotice(`儲存失敗：${result.error}`); return; } const savedId = result.id || prepared.id; setValues(values.map((item) => item.id === selected.id ? { ...prepared, id: savedId } : item)); setSelectedId(savedId); setDirty(false); setNotice('文章已儲存'); };
  const remove = async () => { if (!selected || !window.confirm(`確定刪除「${selected.title}」？`)) return; const result = await deleteArticle(selected.id); if (!result.ok) { setNotice(`刪除失敗：${result.error}`); return; } setValues(values.filter((item) => item.id !== selected.id)); setDirty(false); setMode('list'); setNotice('文章已刪除'); };
  const toggleStatus = (published: boolean) => { if (!selected) return; if (published) { try { if (!isPublishableArticleBody(JSON.parse(selected.body || '[]'))) { setNotice('文章必須先提供正文內容才能發布'); return; } } catch { setNotice('文章必須先提供正文內容才能發布'); return; } } update('status', published ? 'published' : 'draft'); };

  if (mode === 'categories') return <CategoryManagement type={type} values={categories} setValues={setCategories} loading={categoriesLoading} articles={values} onClose={() => setMode('list')} />;
  if (mode === 'list') return <section className="panel article-list-page article-full-panel"><div className="panel-heading article-list-heading"><div><h3>{labels[type]}文章管理</h3><p className="muted">共 {filtered.length} 篇，點擊編輯後才會進入文章編輯畫面。</p></div><div className="editor-actions"><button type="button" className="secondary-btn" onClick={() => setMode('categories')}><FolderCog size={16} />編輯分類</button><button type="button" className="small-btn" onClick={add}><Plus size={15} />新增文章</button></div></div>{notice && <p className="form-notice" role="status">{notice}</p>}<div className="article-filters article-list-filters"><input aria-label={`搜尋${labels[type]}文章`} placeholder="搜尋標題、摘要或分類" value={keyword} onChange={(event) => { setKeyword(event.target.value); setPage(1); }} /><select aria-label="文章狀態" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as typeof statusFilter); setPage(1); }}><option value="all">全部狀態</option><option value="published">已發布</option><option value="draft">草稿</option></select></div>{loading ? <p className="muted">載入中…</p> : pageItems.length === 0 ? <p className="empty">目前沒有符合條件的{labels[type]}文章。</p> : <div className="article-admin-table"><div className="article-admin-row article-admin-head"><span>文章標題</span><span>分類</span><span>發布日期</span><span>狀態</span><span>操作</span></div>{pageItems.map((item) => <div className="article-admin-row" key={item.id}><span><strong>{item.title}</strong><small>{item.excerpt || '尚未填寫摘要'}</small></span><span>{item.category}</span><span>{item.publishedAt || '未設定'}</span><span><i className={item.status === 'published' ? 'status published' : 'status'}>{item.status === 'published' ? '已發布' : '草稿'}</i></span><span><button type="button" className="text-btn" aria-label={`編輯 ${item.title}`} onClick={() => edit(item.id)}><Pencil size={14} />編輯</button></span></div>)}</div>}{totalPages > 1 && <div className="admin-pagination"><button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>上一頁</button><span>{page} / {totalPages}</span><button type="button" disabled={page === totalPages} onClick={() => setPage(page + 1)}>下一頁</button></div>}</section>;
  if (!selected) return null;
  return <><section className="panel form-panel article-edit-page article-full-panel"><div className="panel-heading article-edit-heading"><div><button type="button" className="back-btn" onClick={leaveEditor}><ArrowLeft size={16} />返回{labels[type]}清單</button><h3>編輯{labels[type]}文章</h3>{notice && <span className="form-notice" role="status">{notice}</span>}</div><div className="editor-actions">{dirty && <span className="unsaved-indicator">尚未儲存</span>}<button type="button" className="secondary-btn" onClick={() => setPreviewing(true)}><ExternalLink size={15} />預覽</button><button type="button" className="save-btn" onClick={() => void save()}><Save size={15} />儲存</button><button type="button" className="danger" onClick={() => void remove()}><Trash2 size={15} />刪除文章</button></div></div><div className="two-fields"><label className="field"><span>文章類型</span><input value={labels[type]} readOnly /></label><label className="field"><span>系統網址代碼</span><input aria-label="網址代稱（slug）" value={selected.slug} readOnly /></label></div><label className="field"><span>文章標題</span><input aria-label="文章標題" value={selected.title} onChange={(event) => update('title', event.target.value)} /></label><label className="field"><span>分類</span><select aria-label="分類" value={selected.category} onChange={(event) => update('category', event.target.value)}>{visibleCategories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}{!visibleCategories.some((category) => category.name === selected.category) && <option value={selected.category}>{selected.category}</option>}</select></label><label className="field"><span>發布日期</span><input aria-label="發布日期" type="date" value={selected.publishedAt || new Date().toISOString().slice(0, 10)} onChange={(event) => update('publishedAt', event.target.value)} /></label><label className="field"><span>摘要</span><textarea aria-label="摘要" value={selected.excerpt} onChange={(event) => update('excerpt', event.target.value)} /></label><div className="two-fields"><label className="field"><span>SEO 標題</span><input value={selected.seoTitle || ''} onChange={(event) => update('seoTitle', event.target.value)} /></label><label className="field"><span>SEO 描述</span><input value={selected.seoDescription || ''} onChange={(event) => update('seoDescription', event.target.value)} /></label></div><div className="field"><span>封面圖片</span>{selected.coverUrl && <img className="selected-cover-preview" src={resolveMediaUrl(selected.coverUrl, webOrigin)} alt="目前封面" />}</div><div className="media-picker"><span>快速選擇素材</span><div>{media.map((file) => <button type="button" key={file.id} className={file.url === selected.coverUrl ? 'selected' : ''} aria-label={`選擇 ${file.name}`} onClick={() => update('coverUrl', file.url)}><img src={resolveMediaUrl(file.url, webOrigin)} alt={file.alt || ''} /><small>{file.name}</small></button>)}</div></div><RichTextEditor value={selected.body} onChange={(value) => update('body', value)} media={media} webOrigin={webOrigin} /><label className="check"><input aria-label="已發布" type="checkbox" checked={selected.status === 'published'} onChange={(event) => toggleStatus(event.target.checked)} /> 已發布</label><div className="notice">文章內容會以安全的結構化格式儲存，字型、大小、顏色、對齊、清單、連結與圖片都會保留。</div></section>{previewing && <Preview article={selected} webOrigin={webOrigin} onClose={() => setPreviewing(false)} />}</>;
}
