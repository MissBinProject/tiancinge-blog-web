# Firestore 備份還原演練紀錄

日期：2026-09-20（Asia/Taipei）

## 演練目的

從正式 `(default)` 資料庫的 READY 備份還原到獨立暫存資料庫，確認備份可被 Firestore 接受，並在完成後只讀驗證資料與設定。正式資料庫不會被覆寫。

## 還原來源

| 項目 | 值 |
|---|---|
| 專案 | `tiancinge` |
| 區域 | `asia-east1` |
| 來源資料庫 | `projects/tiancinge/databases/(default)` |
| 備份 | `projects/tiancinge/locations/asia-east1/backups/2790c873-7f47-46e0-a009-00bf41adc193` |
| 備份狀態 | `READY` |
| snapshot time | `2026-09-19T02:23:10.763194Z` |
| 到期時間 | `2026-10-19T02:23:10.763194Z` |
| 暫存資料庫 | `restore-drill-20260920` |
| 還原作業 | `projects/tiancinge/databases/restore-drill-20260920/operations/F-KQo-qZRbTDQHmDWMyv3xAqMXRzYWUtYWlzYQoiChAgGg` |

## 已執行命令

```sh
gcloud firestore backups describe \
  --project=tiancinge --location=asia-east1 \
  --backup=2790c873-7f47-46e0-a009-00bf41adc193

gcloud firestore databases restore \
  --project=tiancinge \
  --source-backup=projects/tiancinge/locations/asia-east1/backups/2790c873-7f47-46e0-a009-00bf41adc193 \
  --destination-database=restore-drill-20260920
```

## 完成結果

還原作業以 `SUCCESSFUL` 完成，暫存資料庫的來源資訊顯示 snapshot `2026-09-19T02:23:10.763194Z`，且沒有連接到正式網站服務。只讀驗證結果如下：

| collection | 文件數 | 結果 |
|---|---:|---|
| `articles` | 4 | 可讀取 |
| `services` | 5 | 可讀取 |
| `article_categories` | 7 | 可讀取 |
| `site_settings` | 1 | 可讀取 |
| `contact_messages` | 17 | 可讀取 |
| `admin_sessions` | 2 | 可讀取 |

驗證後已解除暫存資料庫的 delete protection 並刪除 `restore-drill-20260920`；刪除後再次 `databases describe` 回傳 `NOT_FOUND`。正式 `(default)` 資料庫未被覆寫。

```sh
gcloud firestore operations describe \
  'projects/tiancinge/databases/restore-drill-20260920/operations/F-KQo-qZRbTDQHmDWMyv3xAqMXRzYWUtYWlzYQoiChAgGg' \
  --project=tiancinge
```

「備份還原演練」已完成，可在安全驗收清單勾選；正式備份排程仍需持續觀察下一次備份是否如期產生。
