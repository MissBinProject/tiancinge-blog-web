# Cloud Run staging 與回滾驗證（2026-09-20）

## staging

- 原正式 revision：`tiancinge-web-00037-8hs`
- 固定 image：`asia-east1-docker.pkg.dev/tiancinge/cloud-run-source-deploy/tiancinge-web@sha256:9fda5d1a81037fab6b26a572886020bd2d242760d0e8034c457372c32d0f47aa`
- staging revision：`tiancinge-web-stg-20260920`（1% 流量觀察）
- MFA/recovery candidate：`tiancinge-web-mfa-20260920`（相同正式服務設定，先 0% 流量）
- Runtime service account：`tiancinge-web-runtime@tiancinge.iam.gserviceaccount.com`

## 冒煙與觀察

- staging direct URL `/`：HTTP 200。
- staging `/api/admin/services`：未登入 HTTP 401。
- staging `/api/contact`：GET HTTP 405，表示 method guard 生效。
- 直接 staging URL 回應包含 HSTS、CSP Report-Only、X-Content-Type-Options、Referrer-Policy、Permissions-Policy 與 X-Frame-Options。
- 1% 流量觀察 15 個窗口完成；Cloud Logging 以 revision filter 查詢沒有 ERROR 輸出。

## 回復與發布

- 觀察後先恢復 `tiancinge-web-00037-8hs=100%`，確認舊 revision 可回復。
- 恢復碼登入支援與 UI 通過測試後，`tiancinge-web-mfa-20260920` 已切換為 100% 正式流量；`tiancinge-web-stg-20260920` 保留 0% 作為候選／回滾參考。
- 回切命令使用 `gcloud run services update-traffic ... --to-revisions tiancinge-web-00037-8hs=100`，未刪除舊 revision。

## 回收標記 API 追加發布

- 候選 revision：`tiancinge-web-recycle-20260920`，使用 `tiancinge-web-runtime@tiancinge.iam.gserviceaccount.com`，先以 0% 流量建立。
- 候選 smoke：`/` HTTP 200、未登入 `/api/admin/services` HTTP 401，回應含 HSTS、CSP Report-Only、nosniff、Referrer-Policy 與 Permissions-Policy。
- 目前流量：`tiancinge-web-recycle-api2-20260920=100%`；`tiancinge-web-recycle-api-20260920`、`tiancinge-web-recycle-bin-20260920`、`tiancinge-web-recycle-20260920`、`tiancinge-web-mfa-20260920` 與 `tiancinge-web-00037-8hs` 仍保留於 revision history 作回退。
- 公開 Hosting 回歸：`/`、`/robots.txt`、`/sitemap.xml` HTTP 200；sitemap `application/xml; charset=utf-8`、17 個唯一 HTTPS URL；匿名管理 API 401；`/api/contact` GET 405。
- 本次程式行為：文章、服務、分類、素材與留言 DELETE 改寫 `deletedAt/deletedBy`，後台列表、公開 repository 與 sitemap worker 排除回收資料；Storage 物件保留供受控復原。
- sitemap worker 已更新至 `tiancinge-sitemap-00034-g5p`，並鎖定新的私有 source archive `gs://tiancinge_asia-east1_cloudbuild/static-site/source-8364505f276764ac9482da143823717a6f143e846a92fc2e83c5d0233df99148.tar.gz`（generation `1789879491998335`），後續 Firestore 事件建置會使用同一份回收排除、API 與 alt 修正程式。
- 正式 revision `tiancinge-web-recycle-20260920` 的 Cloud Logging `severity>=ERROR` 查詢無輸出。

## 回收管理入口驗證

- Cloud Run revision `tiancinge-web-recycle-api2-20260920` 已切換 100% 流量；上一版 `tiancinge-web-recycle-api-20260920` 保留作回退。
- 未登入 `POST /api/admin/recycle` 回 HTTP 403，沒有 session 或 CSRF 時不會進入回收操作。
- 入口支援 `restore` 與明確 `PURGE` 確認；永久清除素材時會同步刪除 Storage 物件並寫入 `purge` audit event。

## 回收復原欄位相容性追加發布

- 復原操作現在會同時清除 `deletedAt/deletedBy` 與舊資料可能使用的 `deleted_at` 欄位，避免 legacy tombstone 在復原後仍被資料層排除。
- Cloud Run API 新 revision `tiancinge-web-recycle-api2-20260920` 建立後已切換 100% 流量；`tiancinge-web-recycle-api-20260920` 保留作回退。
- sitemap worker 新 revision `tiancinge-sitemap-00034-g5p` 已部署 100% 流量，使用 source archive generation `1789879491998335`。
- 未登入回收列表仍為 HTTP 401，未登入回收操作仍為 HTTP 403；新 API revision 的 Cloud Logging `severity>=ERROR` 查詢無輸出。
- Web 46 tests、sitemap worker 27 tests、Admin 11 tests、Web/Admin typecheck、Admin build、SEO audit、sitemap verify 與 `git diff --check` 均通過。

## 游標分頁追加發布

- Cloud Run API 候選 `tiancinge-web-cursor20260920` 已完成首頁、安全標頭與匿名管理 API smoke，之後切換 100% 流量；前一個 `tiancinge-web-recycle-api2-20260920` 保留作回退。
- sitemap worker 候選 `tiancinge-sitemap-cursor-20260920` 已切換 100% 流量，鎖定 source archive `gs://tiancinge_asia-east1_cloudbuild/static-site/source-253716e13f037bf862ed68aa96ac1a615f0c5f5766904489e7c1d4557697ae4a.tar.gz`（generation `1789880563111144`）。
- 游標修改只影響未來動態列表查詢；現行靜態 Hosting 版本維持同一組已驗證 HTML、robots 與 sitemap 發布流程。

## 文章詳情回收隔離追加發布

- API revision `tiancinge-web-recycle-guard-20260920` 已以 tag smoke 後切換 100% 流量；未登入回收列表／操作分別回 HTTP 401／403，首頁回 HTTP 200，前一版 `tiancinge-web-cursor20260920` 保留作回退。
- sitemap worker revision `tiancinge-sitemap-recycle-guard-20260920` 已切換 100% 流量，鎖定 source archive generation `1789882234106162`；未授權 `/status` 與 `/events` 回 HTTP 403。
- Web 48 tests、sitemap worker 27 tests、Web/Admin typecheck、SEO audit、sitemap verify 與 `git diff --check` 通過。

正式 24 小時觀察、TOTP secret 註冊、恢復碼交付與實際恢復演練仍需維運者完成；本文件只記錄可由本次操作證明的 staging／回切結果。

## 靜態來源更新與 favicon 修正

- source archive：`gs://tiancinge_asia-east1_cloudbuild/static-site/source-3dc91d82496ea03bed8436db25a1aaf53086851a1173bfced400e08133b3e9c0.tar.gz`，generation `1789884537197391`。
- sitemap worker candidate：`tiancinge-sitemap-favicon-20260920`，Ready 後切換為 100% traffic；舊 `tiancinge-sitemap-recycle-guard-20260920` 保留作回退。
- Cloud Build：`864ae2e7-6833-42c7-a96d-a00d9f963494`，SUCCESS。
- Hosting release：`sites/tiancinge-web/versions/6a41101ef0db7dd4`、`sites/tiancinge-web/releases/1789885117455000`。
- 驗證：首頁原本的 `/favicon.ico` 404 已消失；六個主要頁面 Chrome headless 載入均無 console error 或 4xx，sitemap／robots 端點維持 200。

## CSP report-only 觀察補充

- 以 Chrome headless 載入 `/`、`/services`、`/news`、`/blog`、`/privacy`、`/terms`，並滾動至頁尾觸發延遲資源；六頁均沒有 `securitypolicyviolation` 事件、console error 或主文件 4xx。
- 主文件實際外部來源只有 `fonts.googleapis.com`、`fonts.gstatic.com`、`api.qrserver.com` 與 Firebase Storage 圖片，均符合目前 CSP；Google Maps／Google iframe 內部資源不屬於主文件執行環境。
- 這是自動化瀏覽器觀察，不等同 24 小時真實流量觀察；CSP 仍保持 Report-Only，待維運者完成正式流量觀察後再切換 enforce。

## TOTP 防重放追加發布

- API Cloud Build `fdd8df9b-1ee6-4f2b-bf37-d5c8f679624b` 已成功；Cloud Run revision `tiancinge-web-totp-replay-20260920` 已完成候選 smoke 並切換 100% 流量，`tiancinge-web-cursor20260920` 保留回退。
- `getTotpCounter` 只接受目前時間 ±1 step；Firestore `admin_mfa_replay/{username}` transaction 會拒絕相同或較舊 counter，避免同一組 TOTP 在有效窗口內重播。
- 本次 Web 49 tests、Admin 11 tests、sitemap worker 27 tests 與 TypeScript 檢查均通過；正式 TOTP secret、恢復碼註冊與真實登入演練仍需維運者操作。
