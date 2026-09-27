# 資料安全稽核報告

稽核日期：2026-09-16  
範圍：`apps/web`、`apps/admin`、`packages/contracts`、Firebase/Cloud Run 部署設定。

## 風險摘要

| 等級 | 發現 | 影響 | 建議 |
| --- | --- | --- | --- |
| 高 | Cloud Run 原先使用 Compute Engine 預設服務帳號，具 `roles/editor` 與 Storage/Firestore 權限 | 服務被利用時可橫向讀寫專案資源 | 已建立專用 runtime 與 Cloud Build 帳號並切換服務；舊帳號的專案與資料存取權已全部撤除 |
| 高 | 管理後台曾將留言、設定、文章與素材快照寫入瀏覽器 `localStorage` | 共用電腦、惡意瀏覽器外掛或 XSS 可讀取個資與未發布內容 | 已移除快照寫入及讀取，並清除既有鍵值 |
| 高 | Firestore 沒有備份排程與刪除保護 | 誤刪或帳號被盜時無法快速復原 | 已建立每日/30 天備份並啟用刪除保護 |
| 中 | 管理 JSON API 原本直接 `request.json()` | 大 body 會耗用記憶體與 CPU，增加 DoS 面 | 已加入 JSON/multipart 串流限制；圖片另經 Sharp 解碼重編碼 |
| 中 | Session 與登入限流文件沒有 TTL；登入只有密碼，沒有 MFA | 過期文件持續累積；密碼外洩時風險較高 | 已新增 Firestore TTL、idle timeout、TOTP 挑戰與帳號級限流；正式 MFA 仍待管理員註冊 secret |
| 中 | 內容、素材、留言刪除多為永久刪除，沒有應用層稽核 | 誤刪難以追查，個資處理缺乏證據 | 回收狀態、手動清除、不可變稽核事件 |
| 中 | 上傳圖檔先完整讀入 multipart，且直接保存原始 bytes | 記憶體壓力、EXIF 個資或惡意圖片風險 | 已擋 Content-Length 與實際串流總量，解析後重編碼並移除 EXIF；壓縮炸彈仍需 staging 壓測 |
| 低 | 安全標頭已有 nosniff、Referrer-Policy、Permissions-Policy、X-Frame-Options，CSP 尚在觀察 | 瀏覽器缺少最後一道腳本與資源來源限制 | 已加入 CSP report-only 並移除 `unsafe-eval`；完成來源觀察後 enforce |
| 低 | `uuid` 間接依賴曾有 moderate 公告（GHSA-w5hq-g745-h8pq） | 舊版可能受 ReDoS 風險影響 | 已以 workspace override 固定至 11.1.1，`pnpm audit --prod` 為零漏洞；後續依賴升級需回歸確認 |

## 已確認的安全基線

- Firestore Security Rules 對客戶端讀寫均拒絕；Storage Rules 對 `site-media` 公開讀取、客戶端寫入/刪除拒絕。
- 管理 API 以伺服器 session、Origin 檢查及 CSRF token 保護；未登入請求回傳 401。
- Session cookie 為 HttpOnly、Secure（正式環境）、SameSite=Strict；密碼以 scrypt 驗證。
- 合約層限制 URL scheme、文章 block 數量、文字長度；公開文章輸出前會驗證結構化內容並跳脫 `<`。
- Cloud Run 與網站入口均使用 HTTPS；公開網站、`robots.txt`、`sitemap.xml` 目前回傳 200。
- 管理後台 Hosting 的基礎標頭已加入 `firebase.json` 並於 2026-09-16 重新登入後發布；線上回應已驗證 `nosniff`、Referrer-Policy、Permissions-Policy、X-Frame-Options 與 HSTS。
- Cloud Run 目前需保留 `allUsers` invoker 與 `ingress=all` 以支援 Firebase Hosting rewrite；敏感管理 API 仍由伺服器 session、Origin 與 CSRF 驗證保護，未登入請求回傳 401。後續可評估改為 Cloud Load Balancing ingress，但必須先在 staging 驗證 Hosting rewrite。
- 部署 preflight 原先仍檢查已淘汰的 Supabase 變數，已改為檢查現行 Firebase／Cloud Run server-account 設定，避免部署人員依過期文件開啟錯誤權限。

## 需要持續觀察

- 新服務帳號切換後的 Cloud Logging 403/permission denied；Cloud Run 最新 revision 已無錯誤，建置流程改用獨立 Cloud Build 服務帳號。
- 備份排程第一次實際產生時間與復原演練結果。
- GSC 抓取 sitemap 的狀態（應以公開 URL 200 與 XML schema 驗證為準）。
- Firebase Storage soft delete 目前為 7 天；若要更長復原期需另行核准成本與保存政策。
