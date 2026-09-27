# 2026-09-16 正式環境安全冒煙證據

## 發布

- Cloud Build：`a4a89648-aed0-4bca-8b4b-01a9a36fa6e8`，SUCCESS。
- Image：`gcr.io/tiancinge/tiancinge-web:security-20260916-v7`。
- Cloud Run：`tiancinge-web-00032-c4p`，100% 流量，Ready。
- Runtime service account：`tiancinge-web-runtime@tiancinge.iam.gserviceaccount.com`。

## HTTP

| URL | 狀態 | 回應大小 |
| --- | ---: | ---: |
| `/` | 200 | 73080 bytes |
| `https://tiancinge-admin.web.app/` | 200 | 408 bytes |
| `/robots.txt` | 200 | 109 bytes |
| `/sitemap.xml` | 200 | 1856 bytes |
| `/api/admin/services`（未登入） | 401 | 69 bytes |
| `/api/admin/messages`（未登入） | 401 | 69 bytes |

首頁回應包含 `X-Content-Type-Options: nosniff`、`Strict-Transport-Security`、`Referrer-Policy`、`Permissions-Policy`、`X-Frame-Options` 與 `Content-Security-Policy-Report-Only`；未回傳 `x-powered-by`。
後台 Hosting 首頁回應包含 `X-Content-Type-Options: nosniff`、`Strict-Transport-Security`、`Referrer-Policy`、`Permissions-Policy` 與 `X-Frame-Options`；標頭由 `firebase.json` 發布。
當時動態 SSR 基線的 `robots.txt` 包含 sitemap URL 並排除 `/api/`、`/search`；目前靜態 Hosting 版本只封鎖 `/api/`、`/admin`，`/search` 改由頁面 `noindex,follow` 控制，讓爬蟲仍可沿著結果頁的站內連結發現內容。最新 robots 以 2026-09-20 live smoke 為準；`sitemap.xml` 通過 XML 解析，含 17 個 `<url>`。

## 建置與測試

- Web Vitest：29 tests passed。
- Web/Admin TypeScript：passed。
- Admin Vite production build：passed（僅有既有 chunk size warning）。
- Playwright：公開流程 13 passed、17 個需要伺服器帳號的後台案例在未提供測試密碼時 skipped。
- Cloud Logging：revision `tiancinge-web-00032-c4p` 查詢 `severity>=ERROR` 無結果。
- `pnpm audit --prod --json`：0 vulnerabilities；`uuid` 以 workspace override 固定至 11.1.1。

## 限制

此證據不包含密碼雜湊、session、TOTP、留言正文或任何 secret 值。MFA 註冊、回收還原、備份還原與長時間觀察仍依驗收清單執行。
