# 驗收清單

- [x] `pnpm run build`（web + admin）
- [x] `pnpm run typecheck`
- [x] `pnpm test`（fixture、公開內容與 Contact API 驗證）
- [x] `pnpm exec playwright test e2e/public.spec.ts --workers=1`（11 條公開流程：四種 viewport、手機選單 ARIA／錨點、內頁手機溢出、內頁導覽、缺圖 fallback、404、表單成功／失敗保留內容、最新消息手動輪播、首頁分類入口、價格卡 LINE 入口、草稿公開限制）
- [ ] `pnpm exec playwright test e2e/admin.spec.ts --workers=1`（需以 `E2E_ADMIN_EMAIL`／`E2E_ADMIN_PASSWORD` 提供測試帳號；未提供時測試安全跳過）
- [x] 首頁、服務詳情、消息詳情、部落格詳情可載入
- [x] `POST /api/contact` 成功及必填欄位錯誤回應
- [x] Firebase client／Firestore Rules smoke（匿名讀取遭拒、管理員可讀取受保護內容）
- [ ] Firestore export/import 與 Storage 版本化備份、回復演練
- [x] 桌機與手機 CSS 斷點及水平溢出規則（390px 服務／價格／文章／內頁單欄，消息輪播每頁一張）
- [x] Firebase Authentication、Firestore Rules、Storage Rules 已在 `tiancinge` 專案發布
- [ ] 390／768／1440／1672px 截圖疊圖與設計稿逐區比對
- [ ] 正式自訂網域、環境變數、Firestore export/import 備份與回復演練

本機 fixture 的五張 current、overlay 與 difference 圖已由 `pnpm visual:capture && pnpm visual:diff` 產生；正式勾選仍需店家提供原字型、原始卡片照片及確認文案後重跑。
