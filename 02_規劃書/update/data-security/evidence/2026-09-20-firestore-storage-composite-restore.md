# Firestore＋Storage 複合復原演練

日期：2026-09-20

## 範圍

使用 READY 備份 `projects/tiancinge/locations/asia-east1/backups/2790c873-7f47-46e0-a009-00bf41adc193`，建立隔離 Firestore database `restore-composite-20260920`。演練只讀取隔離資料庫與正式 Storage 物件，不修改正式 Firestore、正式文章、正式服務或正式素材。

## 復原結果

- Restore operation：`projects/tiancinge/databases/restore-composite-20260920/operations/hfyKc2c4vbOeSrtKfPEyoxAqMXRzYWUtYWlzYQoiChAgGg`
- 最終狀態：`done: true`、`progress: COMPLETED`、100/100
- 還原資料庫 collection 數量：`articles=4`、`services=5`、`article_categories=7`、`media_assets=31`、`site_settings=1`、`contact_messages=17`、`admin_sessions=2`
- `media_assets` 中含 `storagePath` 的媒體：8 筆，包含圖片與 MP4。
- 從復原資料庫的 `media_assets`、文章、服務與設定欄位解析出的唯一 Storage 路徑：8 筆。
- 8/8 對應 `gs://tiancinge.firebasestorage.app/site-media/...` 物件以 `gcloud storage objects describe` 讀取成功，並取得 object size 與 generation。

## 清理

- 驗證完成後先將隔離 database `restore-composite-20260920` 的 delete protection 設為 disabled。
- 隔離 database 已刪除；`gcloud firestore databases list` 僅剩正式 `(default)` database，且正式 database 仍維持 delete protection enabled。
- Storage 物件未被修改或刪除；本演練只讀取物件 metadata。

## 驗證命令

```text
gcloud firestore databases restore --source-backup=projects/tiancinge/locations/asia-east1/backups/2790c873-7f47-46e0-a009-00bf41adc193 --destination-database=restore-composite-20260920 --project=tiancinge
gcloud firestore operations describe projects/tiancinge/databases/restore-composite-20260920/operations/hfyKc2c4vbOeSrtKfPEyoxAqMXRzYWUtYWlzYQoiChAgGg --project=tiancinge
```

以 Firebase Admin SDK 讀取隔離 database 的 7 個 collection，解析 `storagePath` 與 Storage URL，再以 `gcloud storage objects describe` 逐一核對 8 個物件；上述讀取與核對結果全數通過。
