# 發布清單

- [ ] 設定正式網域、Supabase URL／key、管理員帳號及 Vercel 專案。
- [ ] 執行 `pnpm preflight:production`，確認官網／後台七個環境變數存在且網址不是本機或範例值。
- [ ] 執行 migration、建立 Storage bucket 與唯一管理員，確認 RLS。
- [ ] 輸入電話、地址、LINE、社群、地圖、政策及正式文章。
- [x] 本機執行 `pnpm run build`、`pnpm run typecheck`、Vitest 及完整 Playwright smoke 流程。
- [x] 本機執行 `pnpm db:verify`，驗證 migration／seed、匿名／非管理員／管理員 RLS、Storage 限制及素材引用保護。
- [ ] 正式環境設定完成後重跑建置、權限及營運流程。
- [x] 本機驗證 390／768／1440／1672px 無溢出、SEO、404、表單與 fixture 草稿限制，並產生五張疊圖基準。
- [ ] 正式字型、素材與 Supabase 權限到位後完成像素疊圖及正式資料驗收。
- [ ] 建立資料庫／素材備份，演練回復與部署回退。

本輪已交付 `supabase/scripts/backup.sh`、`supabase/scripts/restore.sh` 及 `supabase/backup-restore.md`。以上清單仍待正式 Supabase、Storage、Vercel 與店家資料到位後執行並由負責人勾選。
