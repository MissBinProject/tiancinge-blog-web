# 天心閣養生會館

天心閣養生會館官網與內容管理後台。前台以 Next.js 建置，後台以 React/Vite 建置，資料層可接 Supabase；共用資料契約與驗證位於 `packages/contracts`，共用設計變數位於 `packages/design-tokens`。在尚未設定 Supabase 環境變數時，前台與後台使用 `packages/contracts/src/fixtures.ts` 的共用 fixture／localStorage 方便設計驗收。完整 Luna 任務卡位於 `02_規劃書/project/luna-tasks/`。

## 啟動

```bash
pnpm install
pnpm run dev:web       # http://localhost:3000
pnpm run dev:admin     # http://localhost:5173
```

設定 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY` 後即可切換至 Supabase repository；後台另需 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY` 及 `VITE_WEB_URL`。正式上線前請依 `supabase/README.md` 建立唯一 Auth 管理員並加入 `admin_users`，再替換聯絡資訊、LINE 連結、地圖、SEO 及政策文字。

資料庫備份與回復腳本位於 `supabase/scripts/`，完整流程與 Storage 備份注意事項請參考 [`supabase/backup-restore.md`](supabase/backup-restore.md)。

可在本機執行 `pnpm db:backup:verify`，建立暫存資料庫並演練 custom-format 備份、checksum 驗證、資料異動與回復；正式 Supabase 仍需依交接清單另行演練。

正式資料、帳號、網域與店家內容請依 [`production-input-form.md`](02_規劃書/project/production-input-form.md) 填寫，再執行上線清單。

部署前可執行 `pnpm preflight:production`，檢查七個官網／後台環境變數是否存在、網址格式是否正確；檢查不會輸出任何 key 值。

若要依設計稿座標重新產生暫用卡片素材，可執行 `pnpm assets:export`。

若要產生五個桌機區段的設計稿疊圖與像素差異定位圖，先確定官網 dev server 已啟動，再執行 `pnpm visual:capture && pnpm visual:diff`；輸出位於 `02_規劃書/project/visual-baseline/`。

若要檢查 Luna 任務卡是否仍保有完整欄位及 A01–E11 唯一 ID，可執行 `pnpm tasks:verify`。

若本機已安裝 PostgreSQL，可執行 `pnpm db:verify`。腳本會在暫存資料庫執行 migration／seed，並驗證匿名讀寫權限、唯一管理員、Storage MIME 限制、正文圖片引用保護及價格 constraint；不會連線或修改正式 Supabase。

## 驗證

```bash
pnpm run typecheck
pnpm run build
pnpm test
pnpm test:e2e
```

`test:e2e` 會使用本機 Chrome 執行 `e2e/` 內的公開頁與後台流程；若兩個 dev server 已啟動會重用現有服務。

## Vercel 專案

- 兩個 Vercel 專案的 Root Directory 都設為 repository 根目錄（本資料夾），讓 `packages/contracts` 與 `packages/design-tokens` 的 workspace link 能被解析。
- 官網專案 Build Command：`pnpm --filter @tian-xin-ge/web build`；Framework Preset 使用 Next.js。
- 後台專案 Build Command：`pnpm --filter @tian-xin-ge/admin build`；Output Directory：`apps/admin/dist`。`apps/admin/vercel.json` 已提供 BrowserRouter deep-link rewrite。
- 依專案分別設定 `apps/web/.env.example` 與 `apps/admin/.env.example` 中的環境變數；不要把任何 `.env` 檔提交到 repository。
