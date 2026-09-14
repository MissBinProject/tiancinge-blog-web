# 發布清單

- [x] 建立 GCP/Firebase 專案 `tiancinge`、Cloud Run service、兩個 Firebase Hosting site 及管理員 allowlist。
- [ ] 執行 Firebase/GCP 環境檢查，確認 Cloud Run 環境變數、Hosting rewrite 及後台 `VITE_FIREBASE_*` 設定完整。
- [x] 建立 Firestore Native database、Storage bucket、Authentication email/password 及唯一管理員，並發布 Rules。
- [ ] 輸入電話、地址、LINE、社群、地圖、政策及正式文章。
- [x] 本機執行 `pnpm run build`、`pnpm run typecheck`、Vitest 及完整 Playwright smoke 流程。
- [x] 本機執行 `pnpm db:verify`，驗證 migration／seed、匿名／非管理員／管理員 RLS、Storage 限制及素材引用保護。
- [x] 正式環境已完成 Cloud Build、Cloud Run、Firebase Hosting 發布與公開 HTTP smoke test。
- [x] 本機驗證 390／768／1440／1672px 無溢出、SEO、404、表單與 fixture 草稿限制，並產生五張疊圖基準。
- [ ] 正式字型、素材與店家文案到位後完成像素疊圖及正式資料驗收。
- [ ] 建立 Firestore export／import、Storage 版本化備份，演練回復與 Cloud Run revision 回退。

部署細節、費用控制與回退步驟請參考 [`firebase-deployment.md`](firebase-deployment.md)。自訂網域、正式文案、原始字型及圖片仍需店家於上線前確認。
