# 正式服務觀察快照

取證時間：2026-09-20 20:40（Asia/Taipei）

這份紀錄是正式 24 小時觀察開始前的即時快照，不代表 24 小時驗收已完成。

## Cloud Run 狀態

- API `tiancinge-web`：`tiancinge-web-totp-replay-20260920` 100% traffic。
- Sitemap worker `tiancinge-sitemap`：`tiancinge-sitemap-00055-yeq` 100% traffic；source archive generation `1789907093201533`。
- 公開 Hosting 已發布作者／編輯欄位版本 `159c0571d7307e94`，Firestore `_sitemap/status` 回報 `published`、17 個 URL；Admin Hosting 已以 Firebase CLI re-auth 後重新發布。
- 兩個服務在最近 24 小時的 Cloud Logging `severity>=ERROR` 查詢均無輸出。

## 驗證範圍

- 查詢條件：`resource.type="cloud_run_revision"`、對應 service name、`severity>=ERROR`、`freshness=24h`。
- 這是目前服務健康狀態與錯誤日誌的快照；正式 24 小時流量觀察、登入、上傳、留言與後台載入仍需從觀察開始時間持續記錄。
