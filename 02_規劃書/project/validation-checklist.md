# 驗收清單

- [x] `pnpm run build`（web + admin）
- [x] `pnpm run typecheck`
- [x] `pnpm test`（fixture、公開內容與 Contact API 驗證）
- [x] `pnpm exec playwright test e2e/public.spec.ts --workers=1`（11 條公開流程：四種 viewport、手機選單 ARIA／錨點、內頁手機溢出、內頁導覽、缺圖 fallback、404、表單成功／失敗保留內容、最新消息手動輪播、首頁分類入口、價格卡 LINE 入口、草稿公開限制）
- [x] 本機 fixture 後台 E2E：`E2E_ADMIN_PASSWORD=<test-only-value> VITE_ADMIN_AUTH_SERVER=false pnpm exec playwright test e2e/admin.spec.ts e2e/username-login.spec.ts --workers=1`，21 tests passed；證據見 `../update/2026-09-20-seo-indexability/evidence/admin-e2e-2026-09-20.md`
- [ ] 正式管理員帳號的登入、媒體上傳與留言 API E2E（需維運者提供一次性測試憑證）
- [x] 首頁、服務詳情、消息詳情、部落格詳情可載入
- [x] `POST /api/contact` 成功及必填欄位錯誤回應
- [x] Firestore／Storage Rules smoke（瀏覽器直接讀寫遭拒；管理 CRUD 經 Cloud Run API）
- [x] Firestore READY backup 已還原至獨立暫存資料庫，完成 collection 只讀驗證並清理暫存庫；證據見 `../update/data-security/evidence/2026-09-20-firestore-restore-drill.md`
- [x] Storage `site-media` 已啟用 soft delete 與 object versioning，完成單一物件 generation 復原與清理演練；證據見 `../update/data-security/evidence/2026-09-20-storage-versioning.md`
- [x] 桌機與手機 CSS 斷點及水平溢出規則（390px 服務／價格／文章／內頁單欄，消息輪播每頁一張）
- [x] Cloud Run server account、Firestore Rules、Storage Rules 已在 `tiancinge` 專案發布
- [ ] 390／768／1440／1672px 截圖疊圖與設計稿逐區比對
- [ ] 正式自訂網域與正式管理員帳號 E2E（需維運者安排）
- [x] 含 Firestore `storagePath` 的完整素材復原演練；證據見 `../update/data-security/evidence/2026-09-20-firestore-storage-composite-restore.md`

本機 fixture 的五張 current、overlay 與 difference 圖已由 `pnpm visual:capture && pnpm visual:diff` 產生；正式勾選仍需店家提供原字型、原始卡片照片及確認文案後重跑。
