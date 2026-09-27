# 資料安全驗收清單

## P0 已驗收

- [x] `pnpm --filter @tian-xin-ge/web test -- --run`：53 tests passed；另 `pnpm test:sitemap`：28 tests passed；Admin 14 tests passed。
- [x] `pnpm --filter @tian-xin-ge/web typecheck`。
- [x] `pnpm --filter @tian-xin-ge/admin typecheck`。
- [x] Cloud Run revision `tiancinge-web-totp-replay-20260920` 使用 `tiancinge-web-runtime`；上一版 `tiancinge-web-cursor20260920` 保留作回退。
- [x] 公開 `/`、`/robots.txt`、`/sitemap.xml` 回 200；管理 `/api/admin/services`、`/api/admin/messages` 未登入回 401；robots 已排除 `/api/` 與 `/search`。
- [x] Firestore delete protection enabled；每日備份排程 retention 2592000 秒；PITR disabled（依決策）；Storage soft delete 7 天、object versioning 啟用，非現行版本 30 天後清理。
- [x] Storage 單一物件 generation 復原與清理演練完成；未修改正式素材或 Firestore `storagePath`，證據見 `evidence/2026-09-20-storage-versioning.md`。
- [x] `localStorage` 不再寫入 `txg-*` 內容快照；遠端載入失敗不顯示 fixture。

## P1 必驗收

- [ ] MFA：程式已加入 TOTP counter transaction 防重播、±1 step 與恢復碼一次性 transaction；仍需在正式註冊 secret 後做錯誤 TOTP、重播、時鐘 ±30 秒與真實恢復碼驗收。
- [x] Session：程式已加入 8 小時期限、30 分鐘閒置、credential version 撤銷與 Firestore TTL 設定；仍需在隔離資料中補做過期/登出整合演練。
- [x] 限流：程式已加入來源與帳號雜湊 guard、成功清理與 `X-Forwarded-For` 來源；仍需補做多來源整合壓測。
- [x] body/multipart：宣告長度、實際串流超限、單檔/檔案數、像素上限、MIME 與 Sharp 解碼失敗已有測試/實作；壓縮炸彈需在 staging 做資源測試。
- [x] 版本衝突：文章、服務與設定已加入版本條件；文章/服務使用 body `version`，設定使用 `If-Match`，版本不符回 409，不覆蓋較新內容。
- [x] 稽核：服務、文章、分類、設定、留言與素材寫入已記錄 actor/time/action/resource/result/requestId，事件不含 body/secret；刪除已改為 `deletedAt/deletedBy` 回收標記，公開資料與後台列表會排除回收資料；`/api/admin/recycle` 的復原／永久清除受 session＋CSRF 保護並寫入稽核事件。

## P2 必驗收

- [ ] CSP report-only 的自動化六頁觀察已無主文件違規（證據見 `evidence/2026-09-20-staging-rollback.md`）；仍需正式流量觀察後再切 enforce，並確認 SSR、圖片、地圖、社群按鈕。
- [x] Firebase Hosting 後台已發布 `firebase.json` 的 `nosniff`、Referrer-Policy、Permissions-Policy、X-Frame-Options 標頭，線上 HEAD 回應已驗證。
- [x] `pnpm audit --prod` 無 info/low/moderate/high/critical；workspace override 將間接 `uuid` 固定至 11.1.1，已完成 lockfile、建置與測試。
- [x] 備份還原演練已從 READY 備份還原至獨立資料庫，完成 collection 讀取驗證並清理暫存庫；證據見 `evidence/2026-09-20-firestore-restore-drill.md`。secret／log 掃描證據見 `evidence/2026-09-20-secret-log-scan.md`。
- [x] Firestore `storagePath` 與 Storage 物件的複合復原演練已完成，8 筆路徑／物件全數核對成功並清理隔離資料庫；證據見 `evidence/2026-09-20-firestore-storage-composite-restore.md`。
- [x] staging smoke、Cloud Run 1% 流量觀察、Cloud Logging error filter 與回切舊 revision 已完成；證據見 `evidence/2026-09-20-staging-rollback.md`。
- [ ] 24 小時正式流量觀察、登入、上傳、留言與後台載入仍待完成；目前快照見 `evidence/2026-09-20-live-observation-snapshot.md`；每日備份已實際產生 READY 備份並納入上述還原演練。
