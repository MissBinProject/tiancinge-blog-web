# Storage 版本化驗證（2026-09-20）

## 正式設定

- Bucket：`gs://tiancinge.firebasestorage.app`
- Location：`ASIA-EAST1`
- Firebase soft delete：7 天（`604800` 秒）。
- Object versioning：`true`。
- Lifecycle：只有 `isLive=false` 的非現行版本在 30 天後刪除；沒有現行物件的 age-only delete 規則。

## 執行命令

```sh
gcloud storage buckets describe gs://tiancinge.firebasestorage.app --format=json
```

## 結果

`versioning_enabled=true`，`lifecycle_config.rule` 為 `Delete + isLive=false + age=30`，soft delete policy 為 7 天。現行素材不會因這個生命週期規則自動刪除。

## 單一物件復原演練

- 使用非敏感暫存物件 `site-media/.ops-restore-drill-20260920.txt`，未使用任何正式素材或留言內容。
- 先寫入 v1 generation `1789890045513718`，再覆寫成 v2 generation `1789890047893371`；兩個 generation 的內容讀取結果分別為 `v1` 與 `v2`。
- 刪除目前版本後，從舊 v1 generation 複製回同一路徑，產生復原 generation `1789890104044873`；讀取結果確認回到 v1。
- 復原驗證後以 `gcloud storage rm --all-versions` 清除測試物件；一般與 `--all-versions` 列表均無結果。正式素材仍受 7 天 soft delete／30 天非現行版本生命週期管理。
- 本演練證明 Storage generation 可讀取、覆寫、復原與清理；沒有修改任何正式素材 metadata 或 Firestore `storagePath`。
