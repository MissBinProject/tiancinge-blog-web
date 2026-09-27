# SEO 架構開發規劃書

## 1. 目標

在不更換正式網域、文章 slug、首頁錨點或視覺版型的前提下，讓 Google 能穩定發現、讀取、理解並區分服務、消息、部落格與分類內容；同時讓後台能維持可追蹤的作者、來源、更新日期與圖片資訊。

## 2. 架構方案

### 公開頁面

- App Router 頁面維持動態 SSR；每個可索引路由在伺服器端輸出唯一 H1、title、description、canonical、Open Graph 及必要 JSON-LD。
- 服務、消息、部落格詳情共用 metadata 與資料查詢邊界；不存在或未發布資料回傳真正 404。
- 首頁保留錨點摘要，但部落格摘要、分類與頁尾增加普通 `<a>`／`Link` 入口，讓爬蟲可以沿著 HTML 連結發現詳情頁。

### 資料與 API

- 新增分類描述與 SEO 欄位、文章來源、實質內容更新時間、編輯團隊設定及 heading level；所有欄位選填並向後相容。
- 管理 API 延用既有 session、CSRF／Origin、版本衝突及 audit 機制；新增欄位不得新增公開寫入入口。
- 公開 repository 只回傳已發布文章與可見服務；列表使用資料庫篩選與分頁，詳情使用 type + slug + published 精確查詢。
- 同一次伺服器請求內共用設定與資料結果；不導入跨請求內容快取，避免編輯或下架後顯示舊內容。

### 索引與驗收

- robots 允許 Google 讀取 `/search`，由頁面 `noindex,follow` 控制索引；`/api/` 與管理後台仍禁止。
- sitemap 只列出公開、可存取的 URL；`lastmod` 使用 `contentUpdatedAt`，缺值回退可信的發布／更新時間。
- 驗收分成伺服器 HTML、HTTP 狀態、結構化資料、圖片、手機 RWD、效能、Search Console 狀態七組，不以單一 Lighthouse 分數或 sitemap 提交成功代替全部驗收；手機 Lighthouse 三次中位數報告保存於 `validation-checklist.md` 指定證據。

## 3. 實作階段

1. L01～L05：建立基線、metadata、canonical、robots、sitemap 與 404 契約。
2. L06～L12：擴充分類與文章資料契約、後台欄位、來源及內容更新日期。
3. L13～L19：建立編輯團隊、heading 層級、目錄、來源呈現與文章 schema。
4. L20～L23：改精確查詢、資料庫分頁、相關文章、圖片尺寸與載入策略。
5. L24：整合驗收、部署前檢查與 Search Console 證據更新。

## 4. 不在本輪

- 不重寫既有文章正文、不自行填入店家正式資料、不虛構作者或醫療資格。
- 不批次修改既有 slug、不遷移到自訂網域、不導入付費 SEO 平台或外部連結行銷。
- 不把搜尋頁改成可索引內容，不新增只能由 JavaScript 觸發的公開文章入口。
