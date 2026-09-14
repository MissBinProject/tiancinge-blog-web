# Supabase 設定（歷史備份）

> 目前正式架構不使用 Supabase／PostgreSQL。現行資料庫、Auth、Storage 與部署規格請以 `02_規劃書/project/firebase-*.md` 及根目錄 `README.md` 為準；本資料夾只保留早期規劃與驗證腳本，避免誤執行。

1. 建立 Supabase project，於 SQL Editor 執行 `migrations/001_initial.sql`，再執行 `seed.sql`。`site_settings` 由 trigger 保持單一設定列；素材會保存 MIME、大小、儲存路徑與圖片寬高。留言 API 使用 migration 內的 `reserve_contact_submission` 交易函式保存 digest 限流狀態，函式已撤銷匿名／一般登入角色的執行權限，只授予 server role；交易函式會清理兩天前的 guard 紀錄。
2. 在 Authentication 建立唯一管理員帳號並關閉公開註冊；取得該帳號的 user id 後執行 `insert into public.admin_users (user_id) values ('AUTH_USER_UUID');`。migration 的 `only_one_admin` trigger 會拒絕第二個管理員，只有此表中的帳號能管理內容與留言。
3. 將 `apps/web/.env.example` 的變數填入 Vercel 官網；`SUPABASE_SERVICE_ROLE_KEY` 僅放在官網伺服器環境，供已驗證的 `POST /api/contact` 寫入留言。將 `apps/admin/.env.example` 的變數填入後台 Vercel 專案。
4. 確認 `site-media` bucket 為 public read、`is_admin()` write；Storage policy 與 `media_assets` constraint 同時限制 JPEG/PNG/WebP 及 10 MB。管理員上傳的檔案以 Storage URL 寫回內容資料。服務圖片、文章封面及網站設定圖片另由 `is_safe_image_url` constraint 限制為 HTTPS 或站內路徑，LINE 與地圖 Embed URL 只接受 HTTPS。`is_media_path_in_use()` 會阻擋正在服務、文章封面、文章正文圖片或網站設定引用的素材刪除，且僅授予 authenticated／service_role（本機驗證另授予 app_user）執行權限。
5. 以非登入瀏覽器確認草稿文章、隱藏服務及留言列表皆無法被讀取；匿名 Supabase client 也不能直接插入留言，留言只經由 API 伺服器金鑰寫入。

正式環境請另行設定備份排程，並保留 migration 版本，避免直接在 dashboard 手動改表結構。

兩個 Vercel 專案建議都以 repository 根目錄作為 Root Directory，再分別使用 `pnpm --filter @tian-xin-ge/web build` 與 `pnpm --filter @tian-xin-ge/admin build`，確保 workspace 共用套件可被解析。

可使用 `scripts/backup.sh` 建立資料庫 dump，並依 [`backup-restore.md`](backup-restore.md) 執行 checksum 驗證、回復演練與 Storage 素材交接。

有本機 PostgreSQL 時可由專案根目錄執行 `pnpm db:verify`（或直接執行 `scripts/verify-local.sh`），重複套用 migration／seed 並驗證匿名／非管理員／管理員 RLS、Storage 檔案限制、素材引用保護及素材引用函式的角色執行權限。這是本機替身檢查，正式 Supabase 仍需依上線清單以實際帳號重跑。
