# SEO 現況檢查

## 已確認

- `/`, `/services`, `/news`, `/blog`, `/privacy`, `/terms` 與三類詳情頁都回傳 HTTP 200、獨立 title、description、canonical。
- 服務、消息、部落格詳情頁的標題、摘要、正文會出現在伺服器回傳 HTML，不依賴瀏覽器 hydration 才顯示。
- `/sitemap.xml` 與 `/robots.txt` 回傳 HTTP 200，HTTPS 可用，HTTP 會導向 HTTPS。
- 無效詳情頁回傳 HTTP 404 並帶 `noindex`。

## 基線發現與處理結果

- 正式 `robots.txt` 原本可能指向 localhost；已改成 `https://tiancinge-web.web.app/sitemap.xml`。現行版本由 Firebase Hosting 靜態檔案供應；Cloud Run 只處理 API 與發布協調，不是公開頁的必要請求節點。
- 分類與分頁已使用獨立 title、description、canonical；無效分頁回傳 404。
- 首頁、服務詳情、消息詳情與部落格詳情已加入 LocalBusiness、WebSite、Service、Article、BlogPosting 與 BreadcrumbList JSON-LD。
- Firestore 文件 `articles/n-draft`（slug `dt8qch6sy6`）已在備份後改回 `draft`，不會被公開查詢或 sitemap 收錄。
- 圖片已補上 alt fallback、原生尺寸與 WebP；首頁背景使用延遲載入，避免下方區塊阻塞首屏。
- 店家電話 `02-2338-1111` 與地址 `108台北市萬華區桂林路2之5號` 已依提供資料同步；每週營業時間、LINE 與正式服務／活動文案仍需店家確認，列入內容審核工作卡。

## 目標

- 所有可索引 URL 使用 `https://tiancinge-web.web.app` 絕對 canonical。
- 草稿、隱藏服務、搜尋頁、後台不進入索引；sitemap 僅列出可公開且 200 的 URL。
- 讓爬蟲在無 JavaScript 狀態取得主要內容，並以 JSON-LD 描述店家、服務、文章與麵包屑。
- 以手機與桌機第 75 百分位為效能目標：LCP ≤ 2.5 秒、INP ≤ 200 毫秒、CLS ≤ 0.1。

## 本輪執行狀態（2026-09-15）

- 已完成正式網址 helper、robots sitemap localhost 修正、公開 sitemap `lastmod`、列表查詢 metadata、搜尋與 admin noindex、無效列表參數 404。
- 已完成首頁 LocalBusiness/WebSite、服務 Service、消息 Article、部落格 BlogPosting JSON-LD，以及詳情頁可見麵包屑。
- 已完成服務／文章圖片 alt 欄位的資料契約、Firestore mapper、API 驗證與後台表單；空值會以名稱或標題 fallback，儲存時會更新 `updatedAt`。
- 已將 Firestore `articles/n-draft`（slug `dt8qch6sy6`）在備份後改回 `draft`，並重新驗證不會出現在公開 repository 或 sitemap。
- 2026-09-15 的動態 SSR revision `tiancinge-web-00021-sln` 是歷史基線；2026-09-19～20 已切換至 Firebase Hosting 靜態 HTML。最新 Hosting release、Cloud Build 與靜態 smoke 證據見 `02_規劃書/update/2026-09-20-seo-indexability/evidence/final-release-2026-09-20.md`。
- Lighthouse production lab：mobile performance 0.93、LCP 2.5 秒、CLS 0.003、TBT 70 ms；desktop performance 0.96、LCP 1.3 秒、CLS 0.003、TBT 0 ms。這是單次 lab 量測，仍需以 Search Console 的 CrUX/field data 追蹤真實使用者。
- Search Console URL-prefix property 已由具備 property 權限的 `ouyangtaisen@gmail.com` 完成驗證並提交 sitemap；目前 Google 已記錄最後讀取日期，但仍顯示「無法擷取」，屬外部非同步處理，最新證據見 `../2026-09-20-seo-indexability/evidence/a02-gsc-followup-2026-09-20.md`。
