# B 專案與資料基礎任務卡

## B01 建立 workspace、官網與後台骨架
- 參考圖：無新增視覺稿；依 A07 固定資料契約、`packages/contracts/` 與 `supabase/` 實作。
- 目標：建立 pnpm workspace、Next.js 官網及 Vite 後台並可啟動。
- 前置任務：A07。允許修改：根目錄、`apps/web`、`apps/admin`。
- 固定契約：Node、TypeScript、React、Next 版本固定並提交 lockfile。
- 步驟：建立 scripts → 設定 path alias → 加入 build/typecheck。
- 驗收：兩個 dev server、兩個 build 及型別檢查通過；交接：附命令與版本。

- 交接紀錄：2026-09-14｜Codex｜pnpm typecheck && pnpm build && pnpm db:verify；資料證據見 `supabase/` 與 `packages/contracts/`。 本機 fixture 驗收通過。 提交索引見 [commit-map.md](./commit-map.md#b01)。

## B02 建立共用契約與 fixture adapter
- 參考圖：無新增視覺稿；依 A07 固定資料契約、`packages/contracts/` 與 `supabase/` 實作。
- 目標：讓前後台先以相同 fixture 開發，不直接耦合資料庫。
- 前置任務：A07、B01。允許修改：`packages/contracts`、兩端 data/repository。
- 固定契約：畫面只呼叫 use case/repository，不內嵌 Supabase 查詢。
- 步驟：匯出型別 → 建立 fixture → 實作 adapter → 加入測試。
- 驗收：無環境變數時官網與後台正常；交接：附 adapter API。

- 交接紀錄：2026-09-14｜Codex｜pnpm typecheck && pnpm build && pnpm db:verify；資料證據見 `supabase/` 與 `packages/contracts/`。 本機 fixture 驗收通過。 提交索引見 [commit-map.md](./commit-map.md#b02)。

## B03 建立網站設定與服務 migration
- 參考圖：無新增視覺稿；依 A07 固定資料契約、`packages/contracts/` 與 `supabase/` 實作。
- 目標：建立 settings/services 表、索引、seed 及可排序欄位。
- 前置任務：B02。允許修改：`supabase/migrations`、`supabase/seed.sql`。
- 固定契約：service slug unique；price 可空；is_visible、sort_order 必須存在。
- 步驟：寫 migration → 加 RLS → 加測試 seed → 以空資料庫執行。
- 驗收：migration 可重跑，首頁服務及價格共用資料；交接：附 SQL 輸出。

- 交接紀錄：2026-09-14｜Codex｜pnpm db:verify && pnpm db:backup:verify；資料證據見 `supabase/` 與 `packages/contracts/`，單一網站設定列 trigger 已加入 advisory lock。 本機 fixture／暫存 PostgreSQL 驗收通過。 提交索引見 [commit-map.md](./commit-map.md#b03)。

## B04 建立文章、分類與素材 migration
- 參考圖：無新增視覺稿；依 A07 固定資料契約、`packages/contracts/` 與 `supabase/` 實作。
- 目標：建立文章、分類、素材表及引用關係。
- 前置任務：B02、B03。允許修改：Supabase migration/seed。
- 固定契約：文章 slug unique、category FK restrict、body jsonb、status draft/published。
- 步驟：建表 → 加類型與狀態 check → 建索引 → 加 seed 分類。
- 驗收：無效類型、重複 slug、刪除使用中分類均被拒絕；交接：附 SQL 測試。

- 交接紀錄：2026-09-14｜Codex｜pnpm typecheck && pnpm build && pnpm db:verify；資料證據見 `supabase/` 與 `packages/contracts/`。 本機 fixture 驗收通過。 提交索引見 [commit-map.md](./commit-map.md#b04)。

## B05 建立留言與管理員 migration
- 參考圖：無新增視覺稿；依 A07 固定資料契約、`packages/contracts/` 與 `supabase/` 實作。
- 目標：建立 contact_messages、唯一管理員對應表與狀態欄位。
- 前置任務：B03。允許修改：Supabase migration。
- 固定契約：留言 status 僅 unread/handled；公開只能 insert。
- 步驟：建表 → 建 `admin_users` → 建 `is_admin()` → 寫 seed/設定說明。
- 驗收：欄位、狀態與 FK 正常；交接：附管理員建立步驟。

- 交接紀錄：2026-09-14｜Codex｜pnpm db:verify && pnpm db:backup:verify；資料證據見 `supabase/` 與 `packages/contracts/`，單一管理員 trigger 已加入 advisory lock。 本機 fixture／暫存 PostgreSQL 驗收通過。 提交索引見 [commit-map.md](./commit-map.md#b05)。

## B06 建立公開／管理員資料權限
- 參考圖：無新增視覺稿；依 A07 固定資料契約、`packages/contracts/` 與 `supabase/` 實作。
- 目標：讓匿名只讀公開資料，單一 admin 才能管理草稿、留言及設定。
- 前置任務：B03～B05。允許修改：RLS policy 及權限測試文件。
- 固定契約：公開服務需 is_visible，公開文章需 published；管理操作用 `is_admin()`。
- 步驟：啟用 RLS → 加 select/insert/update/delete policies → 以匿名及 admin 驗證。
- 驗收：越權、草稿網址及留言讀取均被拒絕；交接：附測試矩陣。

- 交接紀錄：2026-09-14｜Codex｜pnpm typecheck && pnpm build && pnpm db:verify；資料證據見 `supabase/` 與 `packages/contracts/`。 本機驗證通過；正式 Supabase／Storage 權限或營運演練待執行。 提交索引見 [commit-map.md](./commit-map.md#b06)。

## B07 建立 Storage 與素材 adapter
- 參考圖：無新增視覺稿；依 A07 固定資料契約、`packages/contracts/` 與 `supabase/` 實作。
- 目標：建立 site-media bucket、上傳限制、公開讀取及使用中保護。
- 前置任務：B04、B06。允許修改：Storage policies、admin repository。
- 固定契約：JPEG/PNG/WebP，單檔 10 MB；media_assets 保存引用資料。
- 步驟：建立 bucket → 寫 policies → 實作 upload/list/alt → 檢查格式及大小。
- 驗收：非法檔案拒絕、上傳後可預覽、非 admin 不能寫；交接：附限制測試。

- 交接紀錄：2026-09-14｜Codex｜pnpm typecheck && pnpm build && pnpm db:verify；資料證據見 `supabase/` 與 `packages/contracts/`。 本機驗證通過；正式 Supabase／Storage 權限或營運演練待執行。 提交索引見 [commit-map.md](./commit-map.md#b07)。

## B08 實作設定與服務 repository
- 參考圖：無新增視覺稿；依 A07 固定資料契約、`packages/contracts/` 與 `supabase/` 實作。
- 目標：完成 settings 讀寫、服務查詢、排序與保存。
- 前置任務：B03、B06。允許修改：web/admin repository。
- 固定契約：價格與首頁、列表、詳情使用同一 Service 查詢結果。
- 步驟：寫 mapper → 實作 list/get/upsert → 接 fixture fallback → 驗證空資料。
- 驗收：排序、洽詢價格、隱藏服務規則通過；交接：附 API 與測試。

- 交接紀錄：2026-09-14｜Codex｜pnpm typecheck && pnpm build && pnpm db:verify；資料證據見 `supabase/` 與 `packages/contracts/`。 程式與 fixture 驗證通過；正式資料與環境變數待接入。 提交索引見 [commit-map.md](./commit-map.md#b08)。

## B09 實作文章與分類 repository
- 參考圖：無新增視覺稿；依 A07 固定資料契約、`packages/contracts/` 與 `supabase/` 實作。
- 目標：完成草稿、發布、分類、分頁及安全正文查詢。
- 前置任務：B04、B06。允許修改：web/admin repository。
- 固定契約：公開 query 永遠附 status=published；body 僅結構化 block。
- 步驟：寫 mapper → 實作 list/detail/search/upsert → 驗證 JSON block。
- 驗收：草稿不出現在公開列表、搜尋或 sitemap；交接：附查詢測試。

- 交接紀錄：2026-09-14｜Codex｜pnpm typecheck && pnpm build && pnpm db:verify；資料證據見 `supabase/` 與 `packages/contracts/`。 程式與 fixture 驗證通過；正式資料與環境變數待接入。 提交索引見 [commit-map.md](./commit-map.md#b09)。

## B10 實作留言 repository
- 參考圖：無新增視覺稿；依 A07 固定資料契約、`packages/contracts/` 與 `supabase/` 實作。
- 目標：完成留言列表、詳情、備註及處理狀態。
- 前置任務：B05、B06。允許修改：admin repository、API contract。
- 固定契約：訪客只透過 POST /api/contact；後台才可讀、改 status/note。
- 步驟：寫 mapper → list/detail/update → 接 UI fallback → 驗證空列表與錯誤。
- 驗收：處理狀態可保存，匿名讀取拒絕；交接：附資料流及錯誤碼。
- 交接紀錄：2026-09-14｜Codex｜pnpm typecheck && pnpm build && pnpm db:verify；資料證據見 `supabase/` 與 `packages/contracts/`。 程式與 fixture 驗證通過；正式資料與環境變數待接入。 提交索引見 [commit-map.md](./commit-map.md#b10)。
