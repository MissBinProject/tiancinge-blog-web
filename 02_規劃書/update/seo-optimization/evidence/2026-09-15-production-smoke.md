# 2026-09-15 正式站 SEO smoke evidence

## 發布

- Cloud Build: `gcr.io/tiancinge/tiancinge-web:seo-optimization-20260915-v4`
- Image digest: `sha256:164628dc89892954241b4fa263c41712f3acc414654e5926090af9f913b94dae`
- Cloud Run revision: `tiancinge-web-00021-sln`
- 流量：100% latest revision
- 回退版本：`tiancinge-web-00020-ks7`（Ready）
- Firebase Hosting admin release：已更新 admin `robots.txt`、`noindex,nofollow,noarchive`，並同步服務圖片替代文字與文章封面替代文字欄位。

## HTTP / SSR 結果

- `https://tiancinge-web.web.app/`、`/services`、`/news`、`/blog`、`/privacy`、`/terms`：HTTP 200；各有 title、description、絕對 HTTPS canonical。
- `/services/7usx1gzbua`：HTTP 200；SSR 含服務名稱、摘要、圖片 alt、Service 與 BreadcrumbList JSON-LD。
- `/news/0333lu87r6`：HTTP 200；SSR 含標題、摘要、正文、圖片 alt、Article 與 BreadcrumbList JSON-LD。
- `/blog/edxei4o1pk`：HTTP 200；SSR 含標題、摘要、正文、圖片 alt、BlogPosting 與 BreadcrumbList JSON-LD。
- `/search?q=精油`：HTTP 200，`noindex, follow`，canonical 為 `/search`。
- `/news?category=活動訊息`：HTTP 200，canonical 包含 category；`page=999`：HTTP 404。
- `/news/dt8qch6sy6`：HTTP 404；草稿不會進公開路由。
- `/robots.txt`：HTTP 200，Sitemap 為 `https://tiancinge-web.web.app/sitemap.xml`，不含 localhost。
- `/sitemap.xml`：HTTP 200，共 18 個 URL、12 個可信 `lastmod`；每個 URL 抽查 HTTP 200，未包含草稿 slug `dt8qch6sy6`。
- HTTP 入口會 301 導向 HTTPS；HTTPS 回應含 HSTS。
- `/` 首頁 HTML 使用 WebP 圖片，並以非阻塞方式載入 Google 字型；logo 已由 1254px 原圖縮至適合首屏顯示的 256px WebP。

## Lighthouse production lab

- Mobile：performance `0.93`、LCP `2.5 s`、CLS `0.003`、TBT `70 ms`、總傳輸 `2,130 KiB`。
- Desktop：performance `0.96`、LCP `1.3 s`、CLS `0.003`、TBT `0 ms`、總傳輸 `2,739 KiB`。
- 量測檔案：`/tmp/tiancinge-lighthouse-production-mobile-v4.json`、`/tmp/tiancinge-lighthouse-production-desktop-v4.json`。

## 自動化驗證

- `pnpm --filter @tian-xin-ge/web test`：21 tests passed。
- `pnpm --filter @tian-xin-ge/web typecheck`：通過。
- `pnpm --filter @tian-xin-ge/admin typecheck`：通過。
- `pnpm tasks:verify`：63 張 Luna 卡片通過。
- Playwright 全套並行執行有 2 條因動態資料請求超過 45 秒；改用單 worker、120 秒 timeout 重跑後，相關 2 條均通過。
- Cloud Build `279be60e-6239-4285-b135-f29c8cb335ca` SUCCESS；Cloud Run revision `tiancinge-web-00021-sln` 已健康並承接 100% 流量。

## 尚待外部帳號

（歷史基線，2026-09-15）Search Console URL-prefix property 驗證與 sitemap 提交當時需要由具備該 property 權限的 Google 帳號執行；後續已於 2026-09-20 由 `ouyangtaisen@gmail.com` 完成提交。最新狀態以 [`a02-gsc-followup-2026-09-20.md`](../../2026-09-20-seo-indexability/evidence/a02-gsc-followup-2026-09-20.md) 為準。
