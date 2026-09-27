# SEO 驗收清單

- [x] 每個可索引路由 title、description、canonical 獨立且使用正式 HTTPS 網址。
- [x] 詳情頁以 `curl` 取得 HTML 時包含標題、摘要、正文、封面 alt 與站內連結。
- [x] 草稿／隱藏服務在 URL、搜尋、相關內容及 sitemap 均不可取得。
- [x] `robots.txt` 的 Sitemap 不含 localhost；sitemap URL 全部回傳 200 且有可信 lastmod。
- [x] 搜尋頁與後台帶 noindex；不存在頁面是真實 404。
- [x] LocalBusiness、Service、Article／BlogPosting、BreadcrumbList JSON-LD 可解析且與可見內容一致。
- [x] 390、768、1440、1781、2560 px 無水平溢出，輪播及表單可操作。
- [x] 圖片有具體 alt、尺寸或 aspect-ratio，首屏與延遲載入符合預期。
- [x] Playwright、Vitest、typecheck、production build 通過。
- [x] Search Console URL-prefix property 與 sitemap 提交已有文字紀錄；Google 目前仍顯示「無法擷取」，等待外部非同步處理，最新紀錄見 `../2026-09-20-seo-indexability/evidence/a02-gsc-followup-2026-09-20.md`。
