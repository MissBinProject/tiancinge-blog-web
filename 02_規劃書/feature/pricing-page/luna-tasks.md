# Luna 任務切分

每張卡片限定單一責任、可獨立驗收，預估 1–4 小時；執行時不得覆蓋其他卡片的未提交修改。

| ID | 任務 | 責任檔案 | 驗收條件 |
|---|---|---|---|
| P01 | 建立 `PricingPlan` 合約與五分類常數 | `packages/contracts/src/index.ts`、`fixtures.ts` | typecheck 通過，13 筆 fixture 可讀 |
| P02 | 建立後台價格驗證與 CRUD API | `apps/web/src/features/admin-content/pricing/`、`app/api/admin/pricing/` | 未登入拒絕、欄位驗證、版本衝突與刪除 tombstone 測試通過 |
| P03 | 建立後台價目表編輯器 | `apps/admin/src/main.tsx`、`repositories.ts` | 可新增/編輯/刪除、勾選首頁、排序、上傳圖片與 alt |
| P04 | 建立公開資料載入與靜態快照欄位 | `apps/web/src/lib/data.ts`、`static-snapshot.ts` | Firestore 與快照模式都可取得同一批資料 |
| P05 | 建立首頁推薦價目區塊 | `PricingSection.tsx`、`page.tsx`、CSS | 只顯示可見且勾選首頁的項目，無資料時不破版 |
| P06 | 建立完整 `/pricing` 分頁 | `app/pricing/page.tsx`、`PricingTable.tsx`、CSS | 有 title、description、canonical、H1、分類、價格與行動版 |
| P07 | 對齊服務詳情與結構化資料 | `services/[slug]/page.tsx`、`seo-schema.ts` | 關聯價目出現在詳情頁，不再輸出過時 Offer 價格 |
| P08 | 導覽改為真實分頁連結 | `Header.tsx`、`Footer.tsx` | 首頁、價目表、最新消息、部落格可直接開啟且 active 狀態正確 |
| P09 | 更新 worker、sitemap 與快照投影 | `apps/sitemap-worker/src/{source,document,server,public-snapshot}.mjs` | pricing 變更會觸發建置，sitemap 含 `/pricing` |
| P10 | 靜態建置與 Hosting 發布 | `scripts/*static*`、Cloud Run 設定 | 線上 `/pricing` 回傳完整 HTML，sitemap 可抓取 |
| P11 | SEO 與回歸驗證 | `scripts/check-seo-baseline.mjs`、測試 | typecheck、web test、sitemap test、admin build、SEO baseline 全部通過 |
