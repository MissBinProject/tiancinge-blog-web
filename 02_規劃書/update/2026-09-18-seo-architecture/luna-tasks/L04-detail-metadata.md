# L04｜詳情頁 metadata 與 404

## 目標
統一服務、消息、部落格詳情頁的 metadata、圖片分享資訊與不存在內容行為。

## 前置
L02。

## 修改範圍
只修改 `apps/web/src/app/services/[slug]/page.tsx`、`apps/web/src/app/news/[slug]/page.tsx`、`apps/web/src/app/blog/[slug]/page.tsx` 及必要測試。

## 固定規格
存在且公開的內容使用自訂 SEO title／description，缺值時使用頁面標題／摘要；canonical 為該 slug 的絕對 URL；OG 圖片使用內容圖片並帶具體 alt，缺圖使用網站分享圖；不存在或草稿必須 `notFound()`。

## 驗收
有效 slug 的 SSR HTML 含 H1、摘要、正文、canonical、OG；不存在 slug 回 404 且不含測試資料；三種詳情頁行為一致。

## 交接紀錄
記錄狀態過濾與 fallback 案例，提供 L19 schema 卡使用的欄位契約。
