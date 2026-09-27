import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { loadWebReleases, type WebRelease } from './releaseRepository';

const formatter = new Intl.DateTimeFormat('zh-TW', {
  timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
});

function publishedTime(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? formatter.format(date) : '時間資料異常';
}

function versionName(value: string) {
  const parts = value.split('/');
  return parts[parts.length - 1] || '—';
}

export function WebReleaseHistory() {
  const [rows, setRows] = useState<WebRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    const result = await loadWebReleases();
    setRows(result.rows); setError(result.error); setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  return <section className="panel release-history" aria-busy={loading}>
    <div className="panel-heading release-history-heading">
      <div><h3>網頁發布紀錄</h3><p className="muted">系統完成自動發布並切換正式網站版本後，才會新增紀錄。</p></div>
      <button type="button" className="secondary-btn" onClick={() => void load()} disabled={loading}><RefreshCw size={15} />{loading ? '讀取中…' : '重新整理'}</button>
    </div>
    {error && <div className="error-banner" role="alert">{error}</div>}
    {!error && !loading && rows.length === 0 && <div className="empty">目前還沒有發布紀錄。下一次系統完成自動發布後，紀錄會顯示在這裡。</div>}
    {!error && rows.length > 0 && <div className="release-table" role="table" aria-label="最近 100 筆網頁發布紀錄">
      <div className="release-row release-head" role="row"><span>發布時間</span><span>方式</span><span>網址數</span><span>版本</span></div>
      {rows.map((row) => <div className="release-row" role="row" key={row.id}>
        <time dateTime={row.publishedAt}>{publishedTime(row.publishedAt)}</time>
        <span><em className="status published">自動發布完成</em><small>{row.mode === 'static' ? '完整靜態網站' : '網站索引更新'}</small></span>
        <span>{row.count.toLocaleString('zh-TW')}</span>
        <code title={row.version}>{versionName(row.version)}</code>
      </div>)}
    </div>}
    <small className="release-limit-note">顯示最近 100 筆成功發布紀錄；失敗或被較新版本取代的工作不會列入。</small>
  </section>;
}
