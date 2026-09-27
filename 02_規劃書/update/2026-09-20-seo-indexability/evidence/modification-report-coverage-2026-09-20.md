# 修改報告逐項驗收對照

本表對照 `/Users/ouyangtaisen/Downloads/修改報告.md` 的要求與 2026-09-20 正式狀態。`已完成` 只表示有程式、部署或測試證據；需要 Google 或店家提供資料的項目不提前標記完成。

| 原報告項目 | 狀態 | 驗收證據 |
|---|---|---|
| P0 sitemap HTTP、XML、HTTPS、Googlebot parity | 已完成 | `https://tiancinge-web.web.app/sitemap.xml` HTTP 200、`application/xml; charset=utf-8`、17 URLs；一般 UA／Googlebot body SHA-256 相同；[`a01-endpoint-check-2026-09-20.md`](a01-endpoint-check-2026-09-20.md) |
| P0 robots.txt | 已完成 | `https://tiancinge-web.web.app/robots.txt` HTTP 200、`text/plain; charset=utf-8`，含正式 Sitemap、`Disallow: /search`、`/api/`、`/admin`；同上端點證據 |
| P0 Firebase Hosting routing／headers | 已完成 | 靜態 Hosting 直接供應 HTML、sitemap、robots；只有 `/api/contact` rewrite；`firebase.static.json` 與 live release `159c0571d7307e94` |
| P0 canonical 全站檢查 | 已完成 | `seo:audit` 17 sitemap routes、0 errors；逐路由資料見 [`route-audit-2026-09-20.tsv`](route-audit-2026-09-20.tsv) |
| P1 sitemap 範圍清理 | 已完成 | 目前 17 個唯一 HTTPS URL；草稿、隱藏服務、空分類、法律頁與搜尋工具頁未列入 sitemap |
| P1 lastmod | 已完成 | sitemap worker 以 `contentUpdatedAt`／`updatedAt`／`publishedAt` 產生內容日期；無可信日期時省略；sitemap worker 測試通過 |
| P1 詳情 metadata、正文、內鏈、Breadcrumb | 程式完成；內容仍有警示 | 服務／消息／部落格詳情回傳完整 HTML、self-canonical、title、description、H1、Breadcrumb 與內鏈；`seo:audit` 保留 3 篇消息與 5 個服務正文偏短警示 |
| P1 JavaScript SEO／完整 HTML | 已完成 | 靜態建置產生 17 個 HTML 路由；`curl` 可直接取得核心內容；發布紀錄見 [`final-release-2026-09-20.md`](final-release-2026-09-20.md) |
| P1 Structured Data | 已完成 | 首頁 LocalBusiness／WebSite、服務 Service、文章 Article／BlogPosting、BreadcrumbList；`seo:baseline` 通過 |
| P1 圖片 alt／效能／手機版 | 程式完成；內容仍需校閱 | 圖片 alt、尺寸與 WebP 已加入；390px 重新量測 LCP 416–508ms、CLS < 0.01、TBT 0；完整結果見 `mobile-performance-latest-2026-09-20.json` |
| P1 Blog／News thin-content audit | 部分完成 | 使用者提供的長篇部落格已發布；3 篇既有消息正文仍需店家確認活動狀態、條件、作者與來源；[`content/articles.md`](../content/articles.md) |
| P2 semantic URL migration | 延後 | 目前隨機代碼 URL 可索引且 self-canonical；若遷移，需另立 301、內鏈、sitemap 與回退計畫，不阻塞本輪 P0/P1 |
| GSC 驗證與提交 | 已提交；外部處理中 | `ouyangtaisen@gmail.com` 已在正確 property 提交 `sitemap.xml`；20:49 回查仍為「無法擷取／0」，Google 未提供可操作錯誤碼；[`a02-gsc-followup-2026-09-20.md`](a02-gsc-followup-2026-09-20.md) |
| 修改後回歸與發布 | 已完成 | Web 54、Admin 14、sitemap 28、E2E 13 passed、typecheck、`pnpm audit --prod` 與 Luna 63 張任務卡驗證通過 |

## 尚未能由程式自行完成

1. 店家確認五項服務的實際流程、限制、價格／預約條件、營業時間與文章作者／來源。
2. Google Search Console 完成 sitemap 下載、探索 URL 數與正式索引處理。
3. 正式營運的 TOTP／恢復碼註冊與復原、CSP 24 小時觀察後 enforce、正式 Hosting 緊急回退演練。
