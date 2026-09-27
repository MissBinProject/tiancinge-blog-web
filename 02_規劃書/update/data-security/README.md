# 天心閣養生館｜資料安全優化

本資料夾記錄 2026-09-16 對官網與內容管理後台的資料安全稽核、修正範圍、驗收條件與可交給 Luna 模型執行的任務卡。

## 已執行

- 後台不再以 `localStorage` 保存服務、留言、設定、文章、分類與素材快照；啟動與登出時會清除舊快照。
- 後台遠端資料載入失敗時停止顯示種子資料，避免把過期或未發布內容誤當正式資料。
- 管理 API 新增統一 JSON body 大小限制與串流讀取；登入 8 KiB、文章 512 KiB、其他管理資料 64 KiB。
- Multipart 上傳新增宣告長度與實際串流總量上限，限制單一檔案與欄位數；圖片以 Sharp 解碼、套用 EXIF 方向、移除 metadata 後統一轉 WebP。
- Cloud Run 改用專用服務帳號 `tiancinge-web-runtime@tiancinge.iam.gserviceaccount.com`；舊 Compute 預設服務帳號的專案與資料存取權已全部撤除，建置另使用獨立的 `tiancinge-cloudbuild` 身分。
- Firestore `(default)` 啟用刪除保護，建立每日備份排程，保留 30 天；依決策不啟用 PITR。Storage soft delete 保留 7 天，`site-media` 已啟用 object versioning，非現行版本 30 天後清理，現行素材不受自動刪除規則影響。
- 登入已具備 TOTP 驗證器挑戰；因 secret 尚未完成管理員註冊，目前不強制 MFA。註冊後將 secret 放入 Secret Manager，再開啟登入挑戰。恢復碼驗證已支援 Firestore 雜湊與一次性 transaction consume，管理員註冊與實際碼生成仍需走受控流程。
- Session 已加入 8 小時絕對期限、30 分鐘閒置期限與 Firestore TTL；登入限流同時依來源與帳號雜湊計數，成功登入後清理 guard。
- 文章與服務已加入整數版本回傳與衝突回應；管理寫入已建立最小稽核事件，未記錄正文、密碼、token 或 secret。
- 文章、服務、分類、素材與留言的刪除已改為 `deletedAt/deletedBy` 回收標記；後台列表、公開 repository 與 sitemap worker 會排除回收資料，Storage 物件保留給受控復原流程。
- 安全標頭已加入 HSTS 與 CSP report-only（已移除 `unsafe-eval`）；`.dockerignore` 不再把本機環境檔送入建置上下文。
- Git 已忽略 `.env.*`（保留 `.env.example`），避免本機或 production 設定檔被誤提交；本次掃描未發現 token、私鑰或疑似明碼憑證進入修改差異。
- 部署 preflight 已改為檢查目前 Firebase／Cloud Run server-account 變數，並要求後台 `VITE_ADMIN_AUTH_SERVER=true` 與 scrypt v1 密碼雜湊格式。
- 所有上述修改已通過 Web Vitest、sitemap worker 測試與 Web/Admin TypeScript 檢查；目前 API revision 為 `tiancinge-web-totp-replay-20260920`（含 TOTP counter transaction 防重放），上一版 `tiancinge-web-cursor20260920` 保留作回退；sitemap worker 目前為 `tiancinge-sitemap-00055-yeq`，已鎖定作者／編輯欄位投影的 source archive，上一版 `tiancinge-sitemap-robots-search-20260920` 保留作回退。
- 設定 singleton 現在以 `If-Match` 版本條件寫入，並將新版本回傳給後台，避免兩個視窗互相覆蓋。
- 正式環境驗收證據：[`2026-09-16-production-smoke.md`](evidence/2026-09-16-production-smoke.md)、[`2026-09-16-iam.md`](evidence/2026-09-16-iam.md)。

## 尚待執行

仍需管理員註冊並注入 TOTP secret、建立恢復碼、完成真實登入／恢復演練、保存期滿清除操作、CSP enforce 前的正式流量觀察，以及正式切換後 24 小時觀察。Firestore 備份還原、Storage 單一物件 generation 復原，以及含 `storagePath` 的複合資料復原演練已完成，證據見 `evidence/2026-09-20-firestore-restore-drill.md`、`evidence/2026-09-20-storage-versioning.md` 與 `evidence/2026-09-20-firestore-storage-composite-restore.md`；staging revision、1% 流量觀察、Cloud Logging error filter 與回切舊 revision 已完成，證據見 `evidence/2026-09-20-staging-rollback.md`。管理後台 Hosting 的安全標頭已於 2026-09-16 重新登入後發布並在線上驗證。最新正式端點冒煙、Admin API 401 邊界與依賴掃描見 `evidence/2026-09-20-security-smoke-latest.md`。`uuid` 間接依賴已透過 workspace override 固定至 11.1.1，`pnpm audit --prod` 目前為零漏洞；仍需在後續套件升級時持續確認相容性。每一項都必須完成 `validation-checklist.md` 對應驗收。

## 決策紀錄

- 管理員：單一管理員帳號，加 TOTP 雙重驗證。
- 留言：暫不自動刪除；提供手動刪除、回收流程與稽核紀錄。
- 復原：每日備份，目標最多一天資料遺失、一天工作日內完成復原。
