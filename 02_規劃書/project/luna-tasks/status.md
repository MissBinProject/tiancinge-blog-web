# Luna 任務交接狀態

狀態以「可在本機 fixture 驗收」與「需正式帳號／素材」分開記錄。每張卡的目標、固定契約、步驟與驗收已寫在同目錄的 A～E 任務文件。

| 任務 | 狀態 | 交接證據／下一步 |
|---|---|---|
| A01–A07 | 已完成 | `03_UI設計圖/asset-map.md`、`apps/web/public/assets/crops/README.md`、`packages/contracts`、fixture 測試 |
| B01–B05 | 已完成 | workspace、migration、共用 `packages/contracts/src/fixtures.ts`、seed、`pnpm run build`／`pnpm run typecheck` |
| B06–B07 | 程式完成，本機替身驗證通過，待正式驗證 | `supabase/migrations/001_initial.sql`、`pnpm db:verify` 已驗證匿名／管理員 RLS、Storage MIME 限制與素材引用保護；仍需 Supabase project 執行正式越權測試 |
| B08–B10 | 已完成 fixture，正式資料待接 | web/admin repository 已有 Supabase adapter 與 local fallback；需填入正式環境變數 |
| C01–C15 | 已完成 fixture | 公開路由、首頁區塊與內頁；`e2e/public.spec.ts`、`visual-baseline/current-01..05.png`；消息／部落格裝飾及查看更多入口已補回 |
| C16–C18 | CSS／流程完成，疊圖待確認 | `e2e/public.spec.ts` 檢查 390／768／1440／1672px 無溢出；原始手機稿與正式字型到位後執行疊圖 |
| D01–D17 | 已完成本機操作流程 | `e2e/admin.spec.ts`、後台表單／預覽／素材／分類／留言／設定；Supabase Auth 正式登入待設定 |
| E01–E05 | 程式完成，待正式資料 | settings、服務、文章、搜尋、留言 API、SEO 已接條件式 Supabase；需建立專案並做營運流程測試 |
| E06–E07 | 基準截圖與 overlay 已產生，差異修正待店家確認 | `02_規劃書/project/visual-diff-log.md`、五張 current／overlay／difference PNG；原始照片／字型不足時不可宣稱像素完全一致 |
| E08–E09 | 本機測試完成，正式權限待驗證 | Vitest 12、Playwright 16；需用匿名／唯一管理員帳號重跑 RLS、Storage 與完整營運流程 |
| E10 | 待正式部署 | 正式輸入欄位見 `../production-input-form.md`；需正式網域、Vercel、Supabase、Auth 管理員與店家聯絡資料 |
| E11 | 工具與手冊完成，演練待正式環境 | `supabase/scripts/backup.sh`、`restore.sh`、`supabase/backup-restore.md`；需指定資料庫後執行 backup／restore drill |

## 交接紀錄格式

完成正式環境卡片時，在該卡最後補上：執行日期、操作者、使用的 deployment／Supabase project、命令或 URL、截圖位置、結果與已知差異。正式資料不得寫回 fixture 或測試環境。
