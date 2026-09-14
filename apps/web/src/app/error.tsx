'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main id="main-content" className="not-found" role="alert"><span className="eyebrow">TEMPORARY ERROR</span><h1>頁面暫時無法載入</h1><p>請重新整理；若問題持續，歡迎直接透過 LINE 聯繫我們。</p><button className="btn" onClick={() => reset()}>重新載入　→</button></main>;
}
