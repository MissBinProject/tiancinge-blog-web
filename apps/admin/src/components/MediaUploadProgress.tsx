import type { MediaUploadProgress as ProgressValue } from '../repositories';

export type MediaUploadProgressState = ProgressValue & { fileName: string };

function formatBytes(value: number): string {
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(0, Math.round(value / 1024))} KB`;
}

export function MediaUploadProgress({ value }: { value: MediaUploadProgressState | null }) {
  if (!value) return null;
  const processing = value.phase === 'processing';
  return <div className="media-upload-progress" role="status" aria-live="polite" aria-label={`${value.fileName} 上傳進度`}>
    <div className="media-upload-progress-heading">
      <strong title={value.fileName}>{value.fileName}</strong>
      <span>{processing ? '已傳送，伺服器處理中…' : `正在上傳 ${value.percent}%`}</span>
    </div>
    <progress max={100} value={value.percent}>{value.percent}%</progress>
    <small>{formatBytes(value.loaded)} / {formatBytes(value.total)}{processing ? '・請勿關閉頁面' : ''}</small>
  </div>;
}
