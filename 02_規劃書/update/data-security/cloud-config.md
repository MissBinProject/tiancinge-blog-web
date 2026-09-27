# 雲端安全設定紀錄

專案：`tiancinge`；區域：`asia-east1`；資料庫：`(default)`；bucket：`gs://tiancinge.firebasestorage.app`。

## Cloud Run

- Service：`tiancinge-web`
- Revision：`tiancinge-web-totp-replay-20260920`（100% traffic；前一個可回滾 revision `tiancinge-web-cursor20260920`）
- Image：目前 revision image digest `sha256:9bcd065aae5c2c08f610d56d312387891d206703324f920478695d98a69919bc`；前一版 `tiancinge-web-cursor20260920` digest 為 `sha256:d5037ae3723c428c42872c446e19ad176e2de1b391c1ddf32974f1526216e5bf`。

> 2026-09-20 追加：`tiancinge-web-recycle-guard-20260920` 已接手 100% 流量，包含列表 Firestore cursor 分頁與回收文章詳情隔離，保留 `tiancinge-web-cursor20260920` 作回退；sitemap worker 同步為 `tiancinge-sitemap-recycle-guard-20260920`，source archive generation `1789882234106162`。

> 2026-09-20 追加：favicon 修正後，sitemap worker 已切換至 `tiancinge-sitemap-favicon-20260920`（100% traffic），來源封存為 `static-site/source-3dc91d82496ea03bed8436db25a1aaf53086851a1173bfced400e08133b3e9c0.tar.gz`、generation `1789884537197391`；舊 `tiancinge-sitemap-recycle-guard-20260920` 保留作回退。

> 2026-09-20 追加：API 已切換至 `tiancinge-web-totp-replay-20260920`（100% traffic），加入 TOTP counter 的 Firestore transaction 防重放；Cloud Build `fdd8df9b-1ee6-4f2b-bf37-d5c8f679624b` 成功，image digest 為 `sha256:9bcd065aae5c2c08f610d56d312387891d206703324f920478695d98a69919bc`，舊 `tiancinge-web-cursor20260920` 保留作回退。
- Runtime service account：`tiancinge-web-runtime@tiancinge.iam.gserviceaccount.com`
- 服務帳號權限：`roles/datastore.user`（專案）、`roles/storage.objectAdmin`（指定 bucket）、`roles/secretmanager.secretAccessor`（`ADMIN_PASSWORD_HASH` secret）。
- 舊 `214942104752-compute@developer.gserviceaccount.com` 已撤除專案 `roles/editor`、`roles/datastore.user`、Storage Object Admin、Cloud Build bucket 讀取權與 `ADMIN_PASSWORD_HASH` secret 存取權，目前不再授予本專案資料權限。
- Cloud Build：`tiancinge-cloudbuild@tiancinge.iam.gserviceaccount.com`；僅有專案 `roles/logging.logWriter`、專用 Artifact Registry repositories 的 `roles/artifactregistry.writer`，以及區域 Cloud Build bucket 與 `gs://run-sources-tiancinge-asia-east1` 的建置來源讀取權限。
- Firebase Hosting `admin` 的安全標頭已加入 repo `firebase.json`，並於 2026-09-16 以 `ouyangtaisen@gmail.com` 重新驗證 Firebase CLI 後發布；線上 HEAD 回應已確認標頭生效。

## Firestore

- `deleteProtectionState=DELETE_PROTECTION_ENABLED`
- `pointInTimeRecoveryEnablement=POINT_IN_TIME_RECOVERY_DISABLED`（符合目前決策）
- Backup schedule：`projects/tiancinge/databases/(default)/backupSchedules/43683235-ba67-4f2c-84a8-008529bc5442`
- Recurrence：daily；retention：30 days (`2592000s`)
- TTL：`admin_sessions.expiresAt`、`admin_login_guards.expiresAt`，目前狀態 `ACTIVE`。
- Storage soft delete：7 天；`site-media` bucket 已啟用 object versioning，並設定非現行版本保留 30 天後清理；不自動刪除現行素材。

## 可重複執行的檢查

```bash
gcloud run services describe tiancinge-web --region=asia-east1 \
  --format='value(status.latestReadyRevisionName,spec.template.spec.serviceAccountName)'
gcloud firestore backups schedules list --database='(default)'
gcloud firestore fields ttls list --database='(default)'
gcloud firestore databases describe --format='value(deleteProtectionState,pointInTimeRecoveryEnablement)'
gcloud storage buckets describe gs://tiancinge.firebasestorage.app \
  --format='value(versioning_enabled,lifecycle_config,soft_delete_policy)'
```

執行者不得把 secret 值、session token、留言正文貼入工單、終端輸出或稽核紀錄。
