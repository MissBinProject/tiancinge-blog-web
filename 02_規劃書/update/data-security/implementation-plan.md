# 資料安全實作計畫

## 目標

保護管理員帳號、訪客留言、未發布內容與素材，縮小雲端執行權限，限制輸入資源消耗，讓刪除與復原可追蹤、可演練。

## 執行順序與完成定義

### P0：已完成的立即風險

1. **瀏覽器資料殘留（S01）**：移除所有敏感內容 `localStorage` 快照；載入錯誤不顯示 fixture。完成條件：瀏覽器 Storage 無 `txg-*` 內容鍵，API 失敗畫面不渲染資料。
2. **API body 限制（S02）**：共用 `readJsonObject` 串流讀取與 413 回應；各管理 route 使用明確上限。完成條件：超過上限不進 schema、測試涵蓋 Content-Length 與串流超限。
3. **Cloud Run 最小身分（S03）**：專用服務帳號只具 Firestore、指定 bucket、指定 secret 權限。完成條件：目前 revision `tiancinge-web-totp-replay-20260920` Ready，公開頁 200，未登入管理 API 401；上一版 `tiancinge-web-cursor20260920` 保留作回退。
4. **資料復原基線（S04）**：啟用 Firestore 刪除保護，建立每日 30 天備份。完成條件：排程可列出且保留設定正確；PITR 維持關閉符合決策。

### P1：帳號與工作階段

5. **TOTP MFA（S05）**：已加入 RFC 6238 驗證器與登入挑戰，支援 ±1 step；正式啟用前須由管理員在驗證器註冊 secret，再以 Secret Manager 注入 `ADMIN_TOTP_SECRET`，不得在 log/錯誤回應回傳 secret。
6. **恢復碼（S06）**：產生一次性雜湊恢復碼，使用後立即失效；只在註冊完成頁顯示一次。
7. **Session TTL/撤銷（S07）**：`admin_sessions` 設 `expiresAt` TTL，加入 30 分鐘 idle timeout 與 credential version 撤銷；Cloud Firestore TTL 已啟用。
8. **登入限流（S08）**：同時以 IP 與帳號雜湊限流，僅取 Cloud Run 的 `X-Forwarded-For`；成功登入後清理 guard。

### P1：輸入、內容與刪除

9. **Multipart 上傳限制（S09）**：拒絕超大宣告長度，實際串流限制 multipart 總 bytes、單一檔案與檔案數；超限回 413。
10. **圖片重編碼（S10）**：Sharp 固定解碼 JPEG/PNG/WebP，限制像素與尺寸、套用 EXIF 方向，重編碼 WebP 並移除 metadata。
11. **資料版本（S11）**：文章、服務與設定更新採版本條件寫入，衝突回 409；設定以 `If-Match` header 傳遞版本並由 transaction 遞增。
12. **回收與稽核（S12）**：刪除先標記 `deletedAt/deletedBy`；後台列表、公開資料與靜態建置自動排除回收資料，所有讀寫/刪除寫入稽核事件。永久清除仍須依保存政策由維運者在隔離流程執行。
13. **TTL 與資料保存（S13）**：session/登入 guard/短期 token 設 Firestore TTL；留言依決策不自動刪除，建立手動保存與清除 SOP。

### P2：瀏覽器與供應鏈

14. **CSP 與標頭（S14）**：已加入 report-only、HSTS、nosniff、Referrer-Policy、Permissions-Policy，並移除 `unsafe-eval`；完成外部來源觀察後再 enforce。
15. **依賴修補（S15）**：確認 `uuid` 公告的實際依賴路徑，以 workspace override 固定至相容的 11.1.1，完成 lockfile、建置、測試與 production image 驗證；後續升級仍需回歸確認。
16. **秘密與日誌（S16）**：掃描 git、映像與 CI log；禁止 token、密碼雜湊、留言內容進 log；secret 版本輪替演練。
17. **備份復原演練（S17）**：在隔離專案或暫存資料庫還原最新備份，量測 RPO/RTO，記錄操作者與結果。
18. **正式發布（S18）**：建立 staging revision、冒煙與回滾，確認 Cloud Run IAM、Firebase rules、GSC/SEO 不退化後再切流量。

## 不在本次範圍

不改變公開網站內容策略、不自動刪除留言、不啟用 PITR；舊 Compute service account 的專案與資料存取權已全部撤除，建置使用獨立 Cloud Build service account。
