import { useCallback, useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { Extension, Mark, mergeAttributes, type JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { ARTICLE_FONT_FAMILIES, ARTICLE_FONT_SIZES, normalizeYouTubeEmbedUrl, type Article, type ArticleTextRun } from '@tian-xin-ge/contracts';
import type { AdminMedia, MediaUploadProgress as UploadProgressValue } from '../repositories';
import { resolveMediaUrl } from '../lib/media-url';
import { ArticleEditorToolbar } from './ArticleEditorToolbar';
import { ArticleVideo } from './ArticleVideo';
import { MediaUploadProgress, type MediaUploadProgressState } from './MediaUploadProgress';
import './rich-text-editor.css';

const TextStyle = Mark.create({
  name: 'textStyle',
  addAttributes() { return { color: { default: null }, fontSize: { default: null }, fontFamily: { default: null } }; },
  parseHTML() { return [{ tag: 'span' }]; },
  renderHTML({ HTMLAttributes }) {
    const style = [HTMLAttributes.color && `color:${HTMLAttributes.color}`, HTMLAttributes.fontSize && `font-size:${HTMLAttributes.fontSize}`, HTMLAttributes.fontFamily && `font-family:${HTMLAttributes.fontFamily}`].filter(Boolean).join(';');
    return ['span', mergeAttributes(HTMLAttributes, style ? { style } : {}), 0];
  },
});

const TextAlign = Extension.create({
  name: 'articleTextAlign',
  addGlobalAttributes() {
    return [{ types: ['heading', 'paragraph'], attributes: { textAlign: { default: 'left', renderHTML: (attrs) => attrs.textAlign === 'left' ? {} : { style: `text-align:${attrs.textAlign}` } } } }];
  },
});

function runToNode(run: ArticleTextRun): JSONContent {
  const marks: Array<{ type: string; attrs?: Record<string, unknown> }> = [];
  if (run.bold) marks.push({ type: 'bold' });
  if (run.italic) marks.push({ type: 'italic' });
  if (run.underline) marks.push({ type: 'underline' });
  if (run.strike) marks.push({ type: 'strike' });
  if (run.href) marks.push({ type: 'link', attrs: { href: run.href } });
  if (run.color || run.fontSize || run.fontFamily) marks.push({ type: 'textStyle', attrs: { color: run.color ?? null, fontSize: run.fontSize ?? null, fontFamily: run.fontFamily ?? null } });
  return { type: 'text', text: run.text, marks: marks.length ? marks : undefined };
}

function runsToNodes(runs: ArticleTextRun[] | undefined, fallback: string): JSONContent[] {
  return (runs?.length ? runs : fallback ? [{ text: fallback }] : []).map(runToNode);
}

function toDocument(raw: string, webOrigin: string): JSONContent {
  try {
    const blocks = JSON.parse(raw || '[]') as Article['body'];
    if (!Array.isArray(blocks)) throw new Error();
    return { type: 'doc', content: blocks.map((block) => {
      if (block.type === 'heading') return { type: 'heading', attrs: { level: block.level === 3 ? 3 : 2, textAlign: block.textAlign ?? 'left' }, content: runsToNodes(block.content, block.text) };
      if (block.type === 'list') return { type: block.ordered ? 'orderedList' : 'bulletList', content: (block.items ?? []).map((item, index) => ({ type: 'listItem', content: [{ type: 'paragraph', content: runsToNodes(block.itemContent?.[index], item) }] })) };
      if (block.type === 'quote') return { type: 'blockquote', content: [{ type: 'paragraph', attrs: { textAlign: block.textAlign ?? 'left' }, content: runsToNodes(block.content, block.text) }] };
      if (block.type === 'image') return { type: 'image', attrs: { src: resolveMediaUrl(block.url ?? '', webOrigin), alt: block.alt || block.text, title: block.text, sourceUrl: block.url } };
      if (block.type === 'video') return { type: 'articleVideo', attrs: { src: block.videoKind === 'youtube' ? normalizeYouTubeEmbedUrl(block.url) : resolveMediaUrl(block.url ?? '', webOrigin), title: block.text, sourceUrl: block.url, videoKind: block.videoKind } };
      if (block.type === 'link') return { type: 'paragraph', attrs: { textAlign: block.textAlign ?? 'left' }, content: [{ type: 'text', text: block.text, marks: [{ type: 'link', attrs: { href: block.url } }] }] };
      return { type: 'paragraph', attrs: { textAlign: block.textAlign ?? 'left' }, content: runsToNodes(block.content, block.text) };
    }) };
  } catch { return { type: 'doc', content: [] }; }
}

function runsOf(node: JSONContent): ArticleTextRun[] {
  const runs: ArticleTextRun[] = [];
  for (const child of node.content ?? []) {
    if (child.type === 'hardBreak') { runs.push({ text: '\n' }); continue; }
    if (child.type !== 'text' || typeof child.text !== 'string') continue;
    const run: ArticleTextRun = { text: child.text };
    for (const mark of child.marks ?? []) {
      if (mark.type === 'bold') run.bold = true;
      if (mark.type === 'italic') run.italic = true;
      if (mark.type === 'underline') run.underline = true;
      if (mark.type === 'strike') run.strike = true;
      if (mark.type === 'link' && typeof mark.attrs?.href === 'string') run.href = mark.attrs.href;
      if (mark.type === 'textStyle') {
        const attrs = mark.attrs ?? {};
        if (typeof attrs.color === 'string') run.color = attrs.color;
        if (ARTICLE_FONT_SIZES.includes(attrs.fontSize)) run.fontSize = attrs.fontSize;
        if (ARTICLE_FONT_FAMILIES.includes(attrs.fontFamily)) run.fontFamily = attrs.fontFamily;
      }
    }
    runs.push(run);
  }
  return runs;
}

const textOf = (runs: ArticleTextRun[]) => runs.map((run) => run.text).join('');
function fromDocument(doc: JSONContent): Article['body'] {
  const blocks: Article['body'] = [];
  for (const node of doc.content ?? []) {
    if (node.type === 'heading') { const content = runsOf(node); blocks.push({ type: 'heading', text: textOf(content), content, level: node.attrs?.level === 3 ? 3 : 2, textAlign: node.attrs?.textAlign ?? 'left' }); }
    else if (node.type === 'paragraph') { const content = runsOf(node); blocks.push({ type: 'paragraph', text: textOf(content), content, textAlign: node.attrs?.textAlign ?? 'left' }); }
    else if (node.type === 'bulletList' || node.type === 'orderedList') { const itemContent = (node.content ?? []).map((item) => runsOf(item.content?.[0] ?? {})); blocks.push({ type: 'list', text: '', items: itemContent.map(textOf), itemContent, ordered: node.type === 'orderedList' }); }
    else if (node.type === 'blockquote') { const paragraph = node.content?.[0] ?? {}; const content = runsOf(paragraph); blocks.push({ type: 'quote', text: textOf(content), content, textAlign: paragraph.attrs?.textAlign ?? 'left' }); }
    else if (node.type === 'image' && typeof node.attrs?.src === 'string') blocks.push({ type: 'image', text: typeof node.attrs.title === 'string' ? node.attrs.title : '', url: typeof node.attrs.sourceUrl === 'string' ? node.attrs.sourceUrl : node.attrs.src, alt: typeof node.attrs.alt === 'string' ? node.attrs.alt : '' });
    else if (node.type === 'articleVideo' && typeof node.attrs?.src === 'string') blocks.push({ type: 'video', text: typeof node.attrs.title === 'string' ? node.attrs.title : '', url: typeof node.attrs.sourceUrl === 'string' ? node.attrs.sourceUrl : node.attrs.src, videoKind: node.attrs.videoKind === 'youtube' ? 'youtube' : 'upload' });
  }
  return blocks;
}

export function RichTextEditor({ value, onChange, media, webOrigin, onUploadMedia }: { value: string; onChange: (value: string) => void; media: AdminMedia[]; webOrigin: string; onUploadMedia: (file: File, onProgress?: (progress: UploadProgressValue) => void) => Promise<AdminMedia> }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<MediaUploadProgressState | null>(null);
  const [mediaNotice, setMediaNotice] = useState('');
  const [showYouTubeForm, setShowYouTubeForm] = useState(false);
  const [youtubeUrl, setYouTubeUrl] = useState('');
  const editor = useEditor({ extensions: [StarterKit.configure({ link: false, heading: { levels: [2, 3] } }), Link.configure({ openOnClick: false, autolink: true }), Image.configure({ allowBase64: false }).extend({ addAttributes() { return { ...this.parent?.(), sourceUrl: { default: null } }; } }), ArticleVideo, TextStyle, TextAlign], content: toDocument(value, webOrigin), immediatelyRender: false, onUpdate: ({ editor: instance }) => onChange(JSON.stringify(fromDocument(instance.getJSON()))) });
  const [, refreshToolbar] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const refresh = () => refreshToolbar((revision) => revision + 1);
    editor.on('transaction', refresh);
    return () => { editor.off('transaction', refresh); };
  }, [editor]);
  useEffect(() => { if (editor && !editor.isFocused) editor.commands.setContent(toDocument(value, webOrigin), { emitUpdate: false }); }, [editor, value, webOrigin]);
  const mediaNode = useCallback((asset: AdminMedia) => asset.mimeType.startsWith('video/')
    ? { type: 'articleVideo', attrs: { src: resolveMediaUrl(asset.url, webOrigin), title: asset.alt || asset.name, sourceUrl: asset.url, videoKind: 'upload' } }
    : { type: 'image', attrs: { src: resolveMediaUrl(asset.url, webOrigin), alt: asset.alt || asset.name, title: asset.alt || asset.name, sourceUrl: asset.url } }, [webOrigin]);
  const insertMedia = useCallback((asset: AdminMedia, position?: number) => {
    if (!editor) return;
    const chain = editor.chain();
    if (position === undefined) chain.insertContent(mediaNode(asset)).run();
    else chain.insertContentAt(Math.min(Math.max(position, 0), editor.state.doc.content.size), mediaNode(asset)).run();
    editor.view.dom.focus({ preventScroll: true });
  }, [editor, mediaNode]);
  const uploadAndInsert = useCallback(async (file: File, position?: number) => {
    if (!editor || uploading) return;
    setUploading(true); setMediaNotice(''); setUploadProgress({ fileName: file.name, loaded: 0, total: file.size, percent: 0, phase: 'uploading' });
    try { const asset = await onUploadMedia(file, (progress) => setUploadProgress({ fileName: file.name, ...progress })); insertMedia(asset, position); setMediaNotice(`${asset.mimeType.startsWith('video/') ? '影片' : '圖片'}已上傳並插入游標位置`); }
    catch (error) { setMediaNotice(error instanceof Error ? error.message : '媒體上傳失敗'); }
    finally { setUploading(false); setUploadProgress(null); }
  }, [editor, insertMedia, onUploadMedia, uploading]);
  useEffect(() => {
    if (!editor) return;
    editor.setOptions({ editorProps: { ...editor.options.editorProps,
      handleDrop: (view, event, _slice, moved) => { const file = !moved ? Array.from(event.dataTransfer?.files ?? []).find((item) => /^(image\/(jpeg|png|webp)|video\/(mp4|webm|quicktime))$/.test(item.type) || /\.(mp4|m4v|webm|mov)$/i.test(item.name)) : undefined; if (!file) return false; event.preventDefault(); const position = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ?? view.state.selection.anchor; void uploadAndInsert(file, position); return true; },
      handlePaste: (view, event) => { const file = Array.from(event.clipboardData?.files ?? []).find((item) => /^(image\/(jpeg|png|webp)|video\/(mp4|webm|quicktime))$/.test(item.type) || /\.(mp4|m4v|webm|mov)$/i.test(item.name)); if (!file) return false; event.preventDefault(); void uploadAndInsert(file, view.state.selection.anchor); return true; },
    } });
  }, [editor, uploadAndInsert]);
  if (!editor) return <div className="rich-editor-loading">正在載入編輯器…</div>;
  const setAlignment = (textAlign: 'left' | 'center' | 'right' | 'justify') => editor.chain().updateAttributes('heading', { textAlign }).updateAttributes('paragraph', { textAlign }).run();
  const setLink = () => { const href = window.prompt('請輸入連結網址', editor.getAttributes('link').href || 'https://'); if (href === null) return; if (!href.trim()) editor.chain().unsetMark('link').run(); else editor.chain().setMark('link', { href: href.trim() }).run(); };
  const insertYouTube = () => {
    const url = normalizeYouTubeEmbedUrl(youtubeUrl);
    if (!url) { setMediaNotice('YouTube 網址格式不正確'); return; }
    editor.chain().insertContent({ type: 'articleVideo', attrs: { src: url, sourceUrl: url, title: 'YouTube 影片', videoKind: 'youtube' } }).run();
    editor.view.dom.focus({ preventScroll: true });
    setYouTubeUrl(''); setShowYouTubeForm(false); setMediaNotice('YouTube 影片已插入游標位置');
  };
  return <div className="rich-editor">
    <ArticleEditorToolbar editor={editor} media={media} uploading={uploading} onAlignment={setAlignment} onLink={setLink} onInsertMedia={insertMedia} onUpload={(file) => void uploadAndInsert(file, editor.state.selection.anchor)} onYouTube={() => setShowYouTubeForm((visible) => !visible)} />
    <MediaUploadProgress value={uploadProgress} />
    {showYouTubeForm && <div className="media-insert-panel" role="group" aria-label="插入 YouTube 影片">
      <input aria-label="YouTube 影片網址" type="url" value={youtubeUrl} onChange={(event) => setYouTubeUrl(event.target.value)} placeholder="貼上 YouTube 影片網址" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); insertYouTube(); } }} autoFocus />
      <button type="button" className="media-insert-confirm" onClick={insertYouTube}>插入影片</button>
      <button type="button" onClick={() => { setShowYouTubeForm(false); setYouTubeUrl(''); }}>取消</button>
    </div>}
    <EditorContent editor={editor} />
    <div className="rich-editor-hint"><span>可直接拖曳或貼上圖片／影片到正文中的任意位置。</span>{mediaNotice && <span className={mediaNotice.includes('失敗') || mediaNotice.includes('不正確') ? 'error' : ''} role="status">{mediaNotice}</span>}</div>
  </div>;
}
