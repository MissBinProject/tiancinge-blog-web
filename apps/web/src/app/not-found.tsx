import Link from 'next/link';
export default function NotFound(){return <main className="not-found"><span className="eyebrow">404</span><h1>找不到這個頁面</h1><p>頁面可能已經移動，回到首頁重新開始吧。</p><Link className="btn" href="/">回到首頁　→</Link></main>}
