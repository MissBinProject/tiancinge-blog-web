import type { Editor } from '@tiptap/core';
import { useRef, type ReactNode } from 'react';
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Eraser, Italic, Link2, List, ListOrdered, Quote, Redo2, Strikethrough, Underline, Undo2, Upload, Video } from 'lucide-react';
import { ARTICLE_FONT_FAMILIES, ARTICLE_FONT_SIZES } from '@tian-xin-ge/contracts';
import type { AdminMedia } from '../repositories';

type Props = {
  editor: Editor;
  media: AdminMedia[];
  uploading: boolean;
  onAlignment: (alignment: 'left' | 'center' | 'right' | 'justify') => void;
  onLink: () => void;
  onInsertMedia: (asset: AdminMedia) => void;
  onUpload: (file: File) => void;
  onYouTube: () => void;
};

export function ArticleEditorToolbar({ editor, media, uploading, onAlignment, onLink, onInsertMedia, onUpload, onYouTube }: Props) {
  const viewportRevision = useRef(0);
  const textStyle = editor.getAttributes('textStyle');
  const images = media.filter((item) => item.mimeType.startsWith('image/'));
  const videos = media.filter((item) => item.mimeType.startsWith('video/'));
  const selectionTop = () => {
    try { return editor.view.coordsAtPos(editor.state.selection.head).top; }
    catch { return editor.view.dom.getBoundingClientRect().top; }
  };
  const runWithoutViewportJump = (command: () => void) => {
    const revision = ++viewportRevision.current;
    const beforeTop = selectionTop();
    const beforeScrollX = window.scrollX;
    const beforeScrollY = window.scrollY;
    command();
    editor.view.dom.focus({ preventScroll: true });
    const restore = () => {
      if (viewportRevision.current !== revision || editor.isDestroyed) return;
      const delta = selectionTop() - beforeTop;
      if (Number.isFinite(delta) && Math.abs(delta) > .5) window.scrollBy(0, delta);
      else if (!Number.isFinite(delta)) window.scrollTo(beforeScrollX, beforeScrollY);
    };
    restore();
    requestAnimationFrame(() => {
      restore();
      requestAnimationFrame(() => {
        restore();
        window.setTimeout(restore, 0);
      });
    });
  };
  const command = (run: (chain: ReturnType<Editor['chain']>) => void) => runWithoutViewportJump(() => run(editor.chain()));
  const isAligned = (textAlign: 'left' | 'center' | 'right' | 'justify') => editor.isActive('paragraph', { textAlign }) || editor.isActive('heading', { textAlign });
  const iconButton = (label: string, icon: ReactNode, onClick: () => void, active = false, disabled = false) => <button type="button" aria-label={label} title={label} className={active ? 'active' : ''} disabled={disabled} onClick={onClick}>{icon}</button>;
  return <div className="rich-toolbar" role="toolbar" aria-label="文章格式工具列" onMouseDown={(event) => { if ((event.target as HTMLElement).closest('button')) event.preventDefault(); }}>
    <select aria-label="段落樣式" value={editor.isActive('heading', { level: 3 }) ? 'heading3' : editor.isActive('heading', { level: 2 }) ? 'heading2' : 'paragraph'} onChange={(event) => event.target.value === 'heading3' ? command((chain) => { chain.setHeading({ level: 3 }).run(); }) : event.target.value === 'heading2' ? command((chain) => { chain.setHeading({ level: 2 }).run(); }) : command((chain) => { chain.setParagraph().run(); })}><option value="paragraph">一般文字</option><option value="heading2">標題 H2</option><option value="heading3">小標 H3</option></select>
    <select aria-label="字體" value={textStyle.fontFamily || ''} onChange={(event) => command((chain) => { chain.setMark('textStyle', { ...textStyle, fontFamily: event.target.value || null }).run(); })}><option value="">預設字體</option>{ARTICLE_FONT_FAMILIES.map((font) => <option key={font}>{font}</option>)}</select>
    <select aria-label="文字大小" value={textStyle.fontSize || ''} onChange={(event) => command((chain) => { chain.setMark('textStyle', { ...textStyle, fontSize: event.target.value || null }).run(); })}><option value="">預設大小</option>{ARTICLE_FONT_SIZES.map((size) => <option key={size}>{size}</option>)}</select>
    <label className="color-control" title="文字顏色"><span>色彩</span><input aria-label="文字顏色" type="color" value={textStyle.color || '#5b4149'} onChange={(event) => command((chain) => { chain.setMark('textStyle', { ...textStyle, color: event.target.value }).run(); })} /></label>
    <span className="toolbar-separator" aria-hidden="true" />
    {iconButton('粗體', <Bold size={15} />, () => command((chain) => { chain.toggleBold().run(); }), editor.isActive('bold'))}
    {iconButton('斜體', <Italic size={15} />, () => command((chain) => { chain.toggleItalic().run(); }), editor.isActive('italic'))}
    {iconButton('底線', <Underline size={15} />, () => command((chain) => { chain.toggleMark('underline').run(); }), editor.isActive('underline'))}
    {iconButton('刪除線', <Strikethrough size={15} />, () => command((chain) => { chain.toggleStrike().run(); }), editor.isActive('strike'))}
    {iconButton('加入連結', <Link2 size={15} />, () => runWithoutViewportJump(onLink), editor.isActive('link'))}
    <span className="toolbar-separator" aria-hidden="true" />
    {iconButton('靠左對齊', <AlignLeft size={15} />, () => runWithoutViewportJump(() => onAlignment('left')), isAligned('left'))}
    {iconButton('置中對齊', <AlignCenter size={15} />, () => runWithoutViewportJump(() => onAlignment('center')), isAligned('center'))}
    {iconButton('靠右對齊', <AlignRight size={15} />, () => runWithoutViewportJump(() => onAlignment('right')), isAligned('right'))}
    {iconButton('左右對齊', <AlignJustify size={15} />, () => runWithoutViewportJump(() => onAlignment('justify')), isAligned('justify'))}
    {iconButton('項目清單', <List size={15} />, () => command((chain) => { chain.toggleBulletList().run(); }), editor.isActive('bulletList'))}
    {iconButton('編號清單', <ListOrdered size={15} />, () => command((chain) => { chain.toggleOrderedList().run(); }), editor.isActive('orderedList'))}
    {iconButton('引用文字', <Quote size={15} />, () => command((chain) => { chain.toggleBlockquote().run(); }), editor.isActive('blockquote'))}
    <span className="toolbar-separator" aria-hidden="true" />
    <select aria-label="插入已上傳圖片" defaultValue="" onChange={(event) => { const asset = images.find((item) => item.id === event.target.value); if (asset) onInsertMedia(asset); event.currentTarget.value = ''; }}><option value="">圖片庫</option>{images.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    {videos.length > 0 && <select aria-label="插入已上傳影片" defaultValue="" onChange={(event) => { const asset = videos.find((item) => item.id === event.target.value); if (asset) onInsertMedia(asset); event.currentTarget.value = ''; }}><option value="">影片庫</option>{videos.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}
    <label className="toolbar-upload" title="上傳圖片或影片" aria-busy={uploading}><Upload size={15} /><span>{uploading ? '上傳中' : '上傳媒體'}</span><input aria-label="上傳文章圖片或影片" hidden disabled={uploading} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,.mp4,.m4v,.webm,.mov" onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(file); event.currentTarget.value = ''; }} /></label>
    {iconButton('插入 YouTube 影片', <Video size={16} />, onYouTube)}
    <span className="toolbar-separator" aria-hidden="true" />
    {iconButton('清除格式', <Eraser size={15} />, () => command((chain) => { chain.unsetAllMarks().run(); }))}
    {iconButton('復原', <Undo2 size={15} />, () => command((chain) => { chain.undo().run(); }), false, !editor.can().undo())}
    {iconButton('重做', <Redo2 size={15} />, () => command((chain) => { chain.redo().run(); }), false, !editor.can().redo())}
  </div>;
}
