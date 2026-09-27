# SEO 架構實作證據

執行日期：2026-09-18（Asia/Taipei）。本紀錄只反映目前工作區程式與本機驗證，不代表已部署到正式環境或 Google 已收錄。

## 已完成的程式範圍

- 公開首頁、服務／消息／部落格列表、詳情、分類與編輯團隊頁使用動態 SSR；詳情不存在或未發布時回 404。
- 共用 metadata 產生器輸出絕對 canonical、Open Graph、Twitter 卡片與搜尋 noindex；政策頁也使用同一規則。
- `robots.txt` 允許 `/search` 讀取，`/search` 使用 `noindex,follow`；管理 API 與後台路徑禁止爬取。
- sitemap 僅取公開服務、文章、有效分類與政策頁；文章 `lastmod` 優先使用 `contentUpdatedAt`，編輯團隊資料不完整時不列入 sitemap。
- 文章支援來源、H2／H3、目錄、作者團隊、內容更新日期與 Article／BlogPosting schema；來源只接受 HTTPS。
- 管理後台支援分類介紹／SEO 欄位、文章來源及 H2／H3 編輯；實質內容更新日期由伺服器判定，不能由客戶端任意覆寫。
- 公開文章查詢使用 published/type 篩選與列表欄位 projection；正式索引定義已寫入 `firestore.indexes.json`，部署仍是發布步驟。
- 列表頁使用伺服器分頁結果直接渲染，並防護重複 query 參數造成的型別錯誤；Next.js 平滑捲動設定也已補上正式標記。
- 新增 SEO 基線命令：`SEO_BASE_URL=<origin> pnpm seo:baseline`。

## 驗證結果

| 命令 | 結果 |
| --- | --- |
| `pnpm test` | 通過：11 個 test files、37 tests |
| `pnpm typecheck` | 通過：web 與 admin |
| `pnpm build:web` | 通過；動態分類與編輯團隊路由已產生 |
| `pnpm build:admin` | 通過；Vite 仍有既有 chunk size 警告 |
| `pnpm test:e2e` | 13 passed、17 skipped（需要正式後台登入的案例）；公開端單獨以 1 worker 執行為 11 passed |
| `SEO_BASE_URL=http://localhost:3000 pnpm seo:baseline` | 通過：9 routes、25 sitemap URLs |
| `git diff --check` | 通過 |

## 尚未完成的發布工作

- Firebase CLI 需要具 Hosting／Firestore 權限的帳號重新登入，部署 Hosting 安全標頭與 Firestore indexes。
- 部署後重新執行 sitemap、robots、SSR、404 與索引查詢 smoke test。
- Google Search Console 的 sitemap 報表需要重新提交並等待 Google 重新抓取；提交、即時擷取、解析與收錄狀態要分開記錄。
- 尚未在 staging 完成備份還原、回滾演練與正式 CSP enforce；目前 CSP 維持 report-only 以避免未盤點的外部資源被阻擋。
- 真實分類 SEO 文字、文章來源、作者說明與圖片替代文字仍需由店家確認後填寫。
