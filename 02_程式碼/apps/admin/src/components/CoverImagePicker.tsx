import { useEffect, useRef } from 'react';
import type { AdminMedia } from '../repositories';
import { resolveMediaUrl } from '../lib/media-url';

export function CoverImagePicker({ media, value, webOrigin, onSelect, onClose }: {
  media: AdminMedia[];
  value: string;
  webOrigin: string;
  onSelect: (file: AdminMedia) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = overflow; };
  }, []);
  const images = media.filter((file) => file.mimeType.startsWith('image/'));
  return <dialog ref={dialog} className="cover-picker-dialog" aria-labelledby="cover-picker-title" onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="cover-picker-content">
      <header><h3 id="cover-picker-title">選擇封面圖片</h3><button type="button" className="secondary-btn" onClick={onClose} autoFocus>關閉</button></header>
      <p className="muted">點選圖片即可套用，完成後請儲存文章。</p>
      {images.length === 0 ? <p className="empty">素材庫尚無圖片，請先上傳封面圖片。</p> : <div className="cover-picker-grid">{images.map((file) => <button type="button" key={file.id} aria-label={`選擇 ${file.name}`} aria-pressed={file.url === value} onClick={() => onSelect(file)}>
        <img src={resolveMediaUrl(file.url, webOrigin)} alt={file.alt || ''} loading="lazy" />
        <span>{file.name}</span>{file.url === value && <small>目前封面</small>}
      </button>)}</div>}
    </div>
  </dialog>;
}
