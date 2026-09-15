import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { Extension, Mark, mergeAttributes, type JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { ARTICLE_FONT_FAMILIES, ARTICLE_FONT_SIZES, type Article, type ArticleTextRun } from '@tian-xin-ge/contracts';
import type { AdminMedia } from '../repositories';
import { resolveMediaUrl } from '../lib/media-url';
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

const Underline = Mark.create({
  name: 'underline',
  parseHTML() { return [{ tag: 'u' }]; },
  renderHTML({ HTMLAttributes }) { return ['u', HTMLAttributes, 0]; },
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
      if (block.type === 'heading') return { type: 'heading', attrs: { level: 2, textAlign: block.textAlign ?? 'left' }, content: runsToNodes(block.content, block.text) };
      if (block.type === 'list') return { type: block.ordered ? 'orderedList' : 'bulletList', content: (block.items ?? []).map((item, index) => ({ type: 'listItem', content: [{ type: 'paragraph', content: runsToNodes(block.itemContent?.[index], item) }] })) };
      if (block.type === 'quote') return { type: 'blockquote', content: [{ type: 'paragraph', attrs: { textAlign: block.textAlign ?? 'left' }, content: runsToNodes(block.content, block.text) }] };
      if (block.type === 'image') return { type: 'image', attrs: { src: resolveMediaUrl(block.url ?? '', webOrigin), alt: block.alt || block.text, title: block.text, sourceUrl: block.url } };
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
    if (node.type === 'heading') { const content = runsOf(node); blocks.push({ type: 'heading', text: textOf(content), content, textAlign: node.attrs?.textAlign ?? 'left' }); }
    else if (node.type === 'paragraph') { const content = runsOf(node); blocks.push({ type: 'paragraph', text: textOf(content), content, textAlign: node.attrs?.textAlign ?? 'left' }); }
    else if (node.type === 'bulletList' || node.type === 'orderedList') { const itemContent = (node.content ?? []).map((item) => runsOf(item.content?.[0] ?? {})); blocks.push({ type: 'list', text: '', items: itemContent.map(textOf), itemContent, ordered: node.type === 'orderedList' }); }
    else if (node.type === 'blockquote') { const paragraph = node.content?.[0] ?? {}; const content = runsOf(paragraph); blocks.push({ type: 'quote', text: textOf(content), content, textAlign: paragraph.attrs?.textAlign ?? 'left' }); }
    else if (node.type === 'image' && typeof node.attrs?.src === 'string') blocks.push({ type: 'image', text: typeof node.attrs.title === 'string' ? node.attrs.title : '', url: typeof node.attrs.sourceUrl === 'string' ? node.attrs.sourceUrl : node.attrs.src, alt: typeof node.attrs.alt === 'string' ? node.attrs.alt : '' });
  }
  return blocks;
}

export function RichTextEditor({ value, onChange, media, webOrigin }: { value: string; onChange: (value: string) => void; media: AdminMedia[]; webOrigin: string }) {
  const editor = useEditor({ extensions: [StarterKit.configure({ link: false }), Link.configure({ openOnClick: false, autolink: true }), Image.configure({ allowBase64: false }).extend({ addAttributes() { return { ...this.parent?.(), sourceUrl: { default: null } }; } }), TextStyle, Underline, TextAlign], content: toDocument(value, webOrigin), immediatelyRender: false, onUpdate: ({ editor: instance }) => onChange(JSON.stringify(fromDocument(instance.getJSON()))) });
  useEffect(() => { if (editor && !editor.isFocused) editor.commands.setContent(toDocument(value, webOrigin), { emitUpdate: false }); }, [editor, value, webOrigin]);
  if (!editor) return <div className="rich-editor-loading">正在載入編輯器…</div>;
  const setAlignment = (textAlign: 'left' | 'center' | 'right' | 'justify') => editor.chain().focus().updateAttributes('heading', { textAlign }).updateAttributes('paragraph', { textAlign }).run();
  const setLink = () => { const href = window.prompt('請輸入連結網址', editor.getAttributes('link').href || 'https://'); if (href === null) return; if (!href.trim()) editor.chain().focus().unsetMark('link').run(); else editor.chain().focus().setMark('link', { href: href.trim() }).run(); };
  const textStyle = editor.getAttributes('textStyle');
  return <div className="rich-editor"><div className="rich-toolbar" role="toolbar" aria-label="文章格式工具列" onMouseDown={(event) => { if ((event.target as HTMLElement).closest('button')) event.preventDefault(); }}>
    <div className="toolbar-group"><select aria-label="段落樣式" value={editor.isActive('heading', { level: 2 }) ? 'heading' : 'paragraph'} onChange={(e) => e.target.value === 'heading' ? editor.chain().focus().setHeading({ level: 2 }).run() : editor.chain().focus().setParagraph().run()}><option value="paragraph">一般文字</option><option value="heading">標題</option></select><select aria-label="字體" value={textStyle.fontFamily || ''} onChange={(e) => editor.chain().focus().setMark('textStyle', { ...textStyle, fontFamily: e.target.value || null }).run()}><option value="">預設字體</option>{ARTICLE_FONT_FAMILIES.map((font) => <option key={font}>{font}</option>)}</select><select aria-label="文字大小" value={textStyle.fontSize || ''} onChange={(e) => editor.chain().focus().setMark('textStyle', { ...textStyle, fontSize: e.target.value || null }).run()}><option value="">預設大小</option>{ARTICLE_FONT_SIZES.map((size) => <option key={size}>{size}</option>)}</select><label className="color-control"><span>文字顏色</span><input aria-label="文字顏色" type="color" value={textStyle.color || '#5b4149'} onChange={(e) => editor.chain().focus().setMark('textStyle', { ...textStyle, color: e.target.value }).run()} /></label></div>
    <div className="toolbar-group"><button type="button" aria-label="粗體" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'active' : ''}><b>B</b></button><button type="button" aria-label="斜體" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'active' : ''}><i>I</i></button><button type="button" aria-label="底線" onClick={() => editor.chain().focus().toggleMark('underline').run()} className={editor.isActive('underline') ? 'active' : ''}><u>U</u></button><button type="button" aria-label="刪除線" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'active' : ''}><s>S</s></button><button type="button" aria-label="加入連結" onClick={setLink} className={editor.isActive('link') ? 'active' : ''}>連結</button></div>
    <div className="toolbar-group"><button type="button" aria-label="靠左對齊" onClick={() => setAlignment('left')}>靠左</button><button type="button" aria-label="置中對齊" onClick={() => setAlignment('center')}>置中</button><button type="button" aria-label="靠右對齊" onClick={() => setAlignment('right')}>靠右</button><button type="button" aria-label="左右對齊" onClick={() => setAlignment('justify')}>左右</button></div>
    <div className="toolbar-group"><button type="button" aria-label="項目清單" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'active' : ''}>• 清單</button><button type="button" aria-label="編號清單" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'active' : ''}>1. 清單</button><button type="button" aria-label="引用文字" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'active' : ''}>引用</button><select aria-label="插入已上傳圖片" defaultValue="" onChange={(e) => { const asset = media.find((item) => item.id === e.target.value); if (asset) editor.chain().focus().insertContent({ type: 'image', attrs: { src: resolveMediaUrl(asset.url, webOrigin), alt: asset.alt, sourceUrl: asset.url } }).run(); e.currentTarget.value = ''; }}><option value="">插入素材圖片</option>{media.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
    <div className="toolbar-group"><button type="button" aria-label="清除格式" onClick={() => editor.chain().focus().unsetAllMarks().run()}>清除格式</button><button type="button" aria-label="復原" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>復原</button><button type="button" aria-label="重做" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>重做</button></div>
  </div><EditorContent editor={editor} /><p className="rich-editor-hint">可調整字體、大小、顏色、對齊、清單與連結；內容會以安全的結構化格式儲存。</p></div>;
}
