# SEO 架構驗收清單

## HTTP 與索引

- [x] 首頁、服務／消息／部落格列表與詳情在停用 JavaScript 時仍有正文。
- [x] 正常頁面各只有一個 H1，title、description、canonical、Open Graph 與頁面內容一致。
- [x] 草稿、隱藏服務、不存在 slug、無效分類與非法頁碼回傳真正 404 或 noindex 規則。
- [x] `/search` 可被讀取但為 `noindex,follow`；`/api/` 與後台仍受限制。
- [x] sitemap XML 可解析、只含公開網址、無重複、所有 URL 可取得 200，`lastmod` 符合內容更新規則。

## 內容與結構化資料

- [x] 分類頁有自己的 H1、介紹、title、description、canonical。
- [x] 文章有分類返回、麵包屑、相關文章；三篇上限、排除自己且不混入其他分類。
- [x] 文章目錄只在三個以上 H2／H3 時顯示，錨點穩定且唯一。
- [x] 作者、發布日、實質更新日、來源只在資料存在時輸出，與頁面可見內容一致。
- [x] LocalBusiness、Service、Article／BlogPosting、BreadcrumbList JSON-LD 可解析，沒有虛構資格、評論或療效。

## 資料與效能

- [x] 舊文章與舊分類可讀寫；新欄位缺值不造成錯誤。
- [x] 公開列表使用資料庫篩選／分頁，詳情使用精確查詢；無跨請求舊內容快取。列表以 published/type/category 篩選、列表欄位 projection 與 `publishedAt desc, __name__ desc` 穩定排序；頁碼後續以 Firestore `startAfter` cursor 逐頁讀取，未使用 offset。
- [x] 圖片有具體 alt、尺寸／比例、responsive sizes；首圖優先，其餘延遲載入。
- [x] 390、768、1440 px 無水平溢出，目錄與固定導覽不互相遮擋。
- [x] 每個手機 Lighthouse 條件已跑 3 次並記錄中位數 LCP、CLS、TBT、JS 與圖片傳輸量；報告見 `evidence/lighthouse-mobile-2026-09-20.json`。INP 需互動工作階段才能有代表性，另以既有 Playwright mobile report 記錄頁面載入指標。

## 測試命令

- [x] `pnpm --filter @tian-xin-ge/web test`
- [x] `pnpm typecheck`
- [x] `pnpm --filter @tian-xin-ge/web build`
- [x] `pnpm exec playwright test`（13 passed、17 skipped；需要正式後台登入的案例未執行）
- [x] `git diff --check`

## 外部狀態

- [x] Google Search Console property 驗證與 sitemap 提交狀態有文字證據，見 `../2026-09-20-seo-indexability/evidence/a02-gsc-followup-2026-09-20.md`。
- [x] 提交接受、即時擷取、sitemap 解析與頁面收錄已分開記錄；Google 目前仍顯示「無法擷取」，網站端解析與 HTTP 驗證正常，收錄狀態等待 Google 非同步更新。
