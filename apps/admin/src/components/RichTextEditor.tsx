import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import type { Article } from '@tian-xin-ge/contracts';
import type { AdminMedia } from '../repositories';
import './rich-text-editor.css';

type JsonNode = JSONContent;
function textOf(node: JsonNode): string { return node.text ?? (node.content ?? []).map(textOf).join(''); }
function toDocument(raw: string): JSONContent {
  try { const blocks = JSON.parse(raw || '[]') as Article['body']; if (!Array.isArray(blocks)) throw new Error(); return { type: 'doc', content: blocks.map((block) => block.type === 'heading' ? { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: block.text }] } : block.type === 'list' ? { type: 'bulletList', content: [{ type: 'listItem', content: (block.items ?? []).map((item) => ({ type: 'paragraph', content: [{ type: 'text', text: item }] })) }] } : block.type === 'image' ? { type: 'image', attrs: { src: block.url, alt: block.alt || block.text, title: block.text } } : block.type === 'link' ? { type: 'paragraph', content: [{ type: 'text', text: block.text, marks: [{ type: 'link', attrs: { href: block.url } }] }] } : { type: 'paragraph', content: block.text ? [{ type: 'text', text: block.text }] : [] }) }; } catch { return { type: 'doc', content: [] }; }
}
function fromDocument(doc: JSONContent): Article['body'] {
  const blocks: Article['body'] = [];
  for (const node of doc.content ?? []) {
    if (node.type === 'heading') blocks.push({ type: 'heading', text: textOf(node) });
    else if (node.type === 'paragraph') {
      const link = node.marks?.find((mark) => mark.type === 'link')?.attrs?.href;
      if (link && typeof link === 'string') blocks.push({ type: 'link', text: textOf(node), url: link });
      else blocks.push({ type: 'paragraph', text: textOf(node) });
    } else if (node.type === 'bulletList' || node.type === 'orderedList') blocks.push({ type: 'list', text: '', items: (node.content ?? []).map(textOf).filter(Boolean) });
    else if (node.type === 'image' && typeof node.attrs?.src === 'string') blocks.push({ type: 'image', text: typeof node.attrs.title === 'string' ? node.attrs.title : '', url: node.attrs.src, alt: typeof node.attrs.alt === 'string' ? node.attrs.alt : '' });
  }
  return blocks;
}

export function RichTextEditor({ value, onChange, media }: { value: string; onChange: (value: string) => void; media: AdminMedia[] }) {
  const editor = useEditor({ extensions: [StarterKit, Link.configure({ openOnClick: false, autolink: true }), Image.configure({ allowBase64: false })], content: toDocument(value) as JSONContent, immediatelyRender: false, onUpdate: ({ editor: instance }) => onChange(JSON.stringify(fromDocument(instance.getJSON() as JSONContent))) });
  useEffect(() => { if (editor && !editor.isFocused) editor.commands.setContent(toDocument(value), { emitUpdate: false }); }, [editor, value]);
  if (!editor) return <div className="rich-editor-loading">正在載入編輯器…</div>;
  return <div className="rich-editor"><div className="rich-toolbar" role="toolbar" aria-label="文章格式工具列"><button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}>標題</button><button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'active' : ''}><b>粗體</b></button><button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'active' : ''}><i>斜體</i></button><button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'active' : ''}>• 清單</button><button type="button" onClick={() => editor.chain().focus().undo().run()}>復原</button><button type="button" onClick={() => editor.chain().focus().redo().run()}>重做</button><select aria-label="插入已上傳圖片" defaultValue="" onChange={(event) => { const asset = media.find((item) => item.id === event.target.value); if (asset) editor.chain().focus().setImage({ src: asset.url, alt: asset.alt }).run(); event.currentTarget.value = ''; }}><option value="">插入素材圖片</option>{media.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><EditorContent editor={editor} /><p className="rich-editor-hint">圖片請先在素材管理上傳，再從工具列插入；儲存內容會轉成安全的結構化格式。</p></div>;
}
