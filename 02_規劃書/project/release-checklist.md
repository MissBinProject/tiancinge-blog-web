# 發布清單

- [x] 建立 GCP/Firebase 專案 `tiancinge`、Cloud Run service、兩個 Firebase Hosting site 及管理員 allowlist。
- [x] 執行 Firebase/GCP 環境檢查，確認 Cloud Run 環境變數、靜態 Hosting routing 及後台 `VITE_ADMIN_AUTH_SERVER=true` 設定完整。
- [x] 建立 Firestore Native database、Storage bucket、Cloud Run server-account 管理員驗證與唯一管理員，並發布 Rules。
- [ ] 輸入電話、地址、LINE、社群、地圖、政策及正式文章。
- [x] 本機執行 `pnpm run build`、`pnpm run typecheck`、Vitest 及完整 Playwright smoke 流程。
- [x] Firebase client／Firestore Rules smoke，驗證匿名讀取遭拒及管理員資料讀取。
- [x] 正式環境已完成 Cloud Build、Cloud Run、Firebase Hosting 發布與公開 HTTP smoke test。
- [x] 本機驗證 390／768／1440／1672px 無溢出、SEO、404、表單與 fixture 草稿限制，並產生五張疊圖基準。
- [ ] 正式字型、素材與店家文案到位後完成像素疊圖及正式資料驗收。
- [x] 建立 Firestore 每日備份／刪除保護、Storage 版本化設定，完成 Firestore＋Storage 複合復原與 Cloud Run revision 回退演練；證據見 [`data-security/evidence/2026-09-20-firestore-storage-composite-restore.md`](../update/data-security/evidence/2026-09-20-firestore-storage-composite-restore.md) 與 [`data-security/evidence/2026-09-20-staging-rollback.md`](../update/data-security/evidence/2026-09-20-staging-rollback.md)。

部署細節、費用控制與回退步驟請參考 [`firebase-deployment.md`](firebase-deployment.md)。自訂網域、正式文案、原始字型及圖片仍需店家於上線前確認。
