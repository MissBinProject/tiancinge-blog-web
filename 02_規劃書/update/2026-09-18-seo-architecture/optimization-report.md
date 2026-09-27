# SEO 架構優化建議報告

## 1. 報告範圍

本報告檢查公開網站的網址架構、伺服器輸出、metadata、結構化資料、sitemap、robots、文章導覽、圖片與資料讀取方式。評估目標是養生文章的自然搜尋流量；保留 web.app 網域、首頁錨點與現有版型。文章實際重寫不在本報告的開發範圍。

## 2. 已確認的基礎能力

- Next.js App Router 的首頁、服務、消息、部落格列表與三類詳情頁均使用動態伺服器輸出。
- 以 `curl` 取得的詳情頁 HTML 已包含 H1、摘要、正文、圖片 alt、麵包屑及 JSON-LD，不依賴瀏覽器 hydration 才顯示正文。
- `/robots.txt` 與 `/sitemap.xml` 可由 HTTPS 取得；sitemap 僅列公開內容，草稿不應進入公開 repository 或 sitemap。
- 現有 metadata 已支援網站設定、列表頁參數、詳情頁 SEO 欄位與 canonical；網站使用 HTTPS 絕對 origin。
- 現有 JSON-LD 已涵蓋 LocalBusiness、WebSite、Service、Article／BlogPosting 與 BreadcrumbList。
- 圖片已存在 WebP、alt fallback、缺圖 fallback 與部分首圖優先載入；公開頁面有手機版回歸測試。

## 3. 已確認的改善點

### P0：搜尋引擎理解與網址一致性

1. metadata 產生邏輯分散於各頁，容易讓 title、description、Open Graph 與 canonical 的 fallback 不一致。
2. `/search` 同時有 noindex 與 robots 禁止規則；禁止抓取會讓搜尋引擎看不到 noindex，應改為允許讀取並以 noindex 控制索引。
3. 分類與分頁目前可運作，但需明確固定第一頁、後續頁及不存在分類／頁碼的 canonical 與 404 規則。
4. sitemap 的 `lastmod` 應以實際內容更新時間為主，不能因單純改 SEO 欄位或重新儲存而假裝文章有實質更新。

### P1：文章品質訊號與內部連結

1. 文章正文目前偏短，技術可以讓 Google 讀到內容，卻不能替代原創、完整且對讀者有幫助的文章。
2. 文章詳情缺少相關文章、分類返回入口及可選的正文目錄，內部連結深度不足。
3. 分類頁只有篩選結果，缺少分類名稱、介紹及自己的 SEO 描述，搜尋入口內容薄弱。
4. 文章 schema 缺少明確的組織作者與可見的編輯團隊說明；不能輸出未核實的個人資格。
5. 文章目前讀取整個公開集合後再以 slug 尋找，資料量增加時會放大延遲與成本。

### P2：效能與維運

1. 列表先取得全部文章再在記憶體分頁；應以資料庫篩選、游標與穩定排序降低傳輸量。
2. 圖片已有 WebP，但缺少一致的尺寸／比例與 responsive sizes 契約，可能造成版面位移或下載過大。
3. Search Console 的提交、即時擷取、sitemap 解析與頁面收錄是不同狀態，需分開記錄，不能用其中一項代替其他項目。

## 4. 風險與限制

- 目前網域是 web.app；保留它可避免遷移風險，但品牌網域、信任度與後續搬遷不在本輪。
- 文章涉及健康與養生，內容應由店家編輯團隊確認來源與措辭；不得以模型生成的療效或資格作為 SEO 素材。
- 公開圖片 URL 若被知道仍可讀取；這是目前素材供前台使用的設計，敏感圖片不可上傳到公開素材。
- sitemap 狀態可能延遲更新；工程驗收以實際 HTTP、XML、Google 即時檢查及 Search Console 報表分層記錄。

## 5. 建議優先順序

先完成共用 metadata、搜尋頁索引規則與資料契約，再加入分類／作者／文章導覽，最後處理精確查詢、圖片及整合驗收。所有新增欄位採選填與舊資料 fallback，避免一次性資料遷移造成公開頁面中斷。

Google 的內容建議以讀者價值、完整描述、原創資訊與可驗證的作者背景為核心；本報告把這些列為內容驗收條件，而非承諾特定排名。[Google 內容品質指引](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
