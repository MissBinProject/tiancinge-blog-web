# 備份、回復與交接

## 備份範圍

- PostgreSQL 資料庫：網站設定、服務、文章、分類、留言、管理員關聯及 migration 狀態。
- Storage 素材：`site-media` bucket 需另外保留檔案清單與物件內容；資料庫備份不包含 bucket 物件。
- 程式碼與環境設定：以部署平台的專案版本與環境變數匯出功能保存，環境變數檔案不得提交到 repository。

## 建立資料庫備份

使用 Supabase Dashboard 的 direct database connection string（不要使用 anon key）：

```bash
SUPABASE_DB_URL='postgresql://...' ./supabase/scripts/backup.sh backups
```

腳本會產生 custom-format `.dump` 與 `.sha256` 檔案。建議至少保留每日一份、異地保存最近 30 份，並在每次 migration 或正式資料大量變更前額外備份。

本機可用 `pnpm db:backup:verify` 執行不連線正式環境的演練。腳本會建立暫存 PostgreSQL、套用 migration／seed、產生 `.dump` 與 checksum、清除服務／文章後回復，最後驗證 5 筆服務及 7 篇已發布文章仍存在。

## 素材備份

在 Supabase Dashboard 的 Storage 頁面匯出 `site-media` 物件，或使用已驗證的 Storage CLI／管理 API 下載物件；同時保存 `media_assets` 的資料庫備份。回復後確認 `storage_path` 與內容管理頁的圖片網址一致。

## 回復演練

回復會清理目標資料庫中的同名物件，必須先確認 URL 指向暫存或已停機的專案：

```bash
CONFIRM_RESTORE=YES SUPABASE_DB_URL='postgresql://...' \
  ./supabase/scripts/restore.sh backups/tian-xin-ge-YYYYMMDDTHHMMSSZ.dump
```

完成後依序驗證：

1. 執行 `supabase/migrations/001_initial.sql` 所需的 migration 狀態與 RLS policy。
2. 匿名訪客只能讀取可見服務、已發布文章及公開設定；不能讀取留言或草稿。
3. 唯一管理員可登入後台、讀取／修改內容及素材；正在使用的素材不能刪除。
4. 官網首頁、服務／文章詳情、搜尋、`/sitemap.xml`、聯絡表單及後台留言頁可正常操作。
5. 若素材另行回復，檢查 `site-media` bucket 權限、MIME／10 MB 限制與每個 `storage_path`。

## 部署回退

Vercel 以最後一個通過驗證的 deployment 執行 Promote to Production；回退後重新執行首頁、API、登入及草稿權限 smoke test。回復責任人、備份保存位置、正式網域與 Supabase 專案識別資訊，於上線交接時填入 `02_規劃書/project/release-checklist.md`。
