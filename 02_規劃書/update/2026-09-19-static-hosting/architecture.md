# 程式規劃書：靜態官網與 API 分離

## 資料與發布流程

```text
後台儲存公開內容
  → Firestore 事件合併 60 秒
  → Cloud Tasks 呼叫 sitemap worker
  → 私有 GCS source archive 建立 Cloud Build
  → 私有 GCS source archive 建立 Cloud Build
  → Firestore 唯讀交易取得一份公開快照
  → Next.js static export
  → 驗證 HTML + sitemap + robots
  → Firebase Hosting preview candidate
  → worker clone/finalize/release 到 live
```

快照檔不屬於公開產物。內容雜湊會同時記錄於發布版本與 `_sitemap/status`；候選版本的序號低於目前 live 時不得覆寫。

## 公開與私有介面

| 路徑／資料 | 位置 | 規則 |
|---|---|---|
| `/`、`/services/**`、`/news/**`、`/blog/**`、`/privacy`、`/terms` | Firebase Hosting 靜態 HTML | 每次發布由同一快照重建 |
| `/search` | Firebase Hosting 靜態 shell + 公開搜尋資料 | `noindex`，不可列入 sitemap |
| `/api/contact` | Cloud Run | 保留既有表單 API |
| 後台 `/api/admin/**` | Cloud Run | 維持 session、CSRF、rate limit 與稽核 |
| Snapshot、Cloud Build log、`_sitemap` 狀態 | 私人 GCP 資源 | 不可由瀏覽器讀取 |

固定路由、詳情、分類與實體分頁都會有 HTML。內部文章與分類連結採 `/blog/category/{name}`、`/blog/page/2` 等實體網址；舊 query 連結的相容導向在切換卡處理。

## 失敗、下架與回滾

- Firestore 讀取、編譯、產物驗證、候選上傳任一失敗時，live release 保持不動；後台只顯示「已儲存，尚未上線」。
- 正常事件於 60 秒窗口內合併。新事件發生在建置中時保留下一輪，不能遺失。
- 緊急下架另建優先發布版本：移除文章詳情、相關列表、首頁摘要、搜尋資料與 sitemap，再安排完整建置。下架結果未發佈前不可顯示成功。
- 回滾必須比對下架紀錄，禁止恢復已撤除內容的舊版本。

## 設定與安全限制

- `firebase.static.json` 只允許 `/api/contact` rewrite 到 Cloud Run，不能保留公開頁的 `**` fallback rewrite。
- HTML 必須 `must-revalidate`；`/_next/static/**` 才可 immutable 長快取。
- Cloud Build service account：Firestore Datastore Viewer、Firebase Hosting Admin、Cloud Run Invoker（私有 worker）。
- sitemap worker service account：建立指定來源的 Cloud Build 與使用專用 build service account 的最小權限；Cloud Tasks 保持單一併發。
- 舊 sitemap worker 在 `PUBLIC_RELEASE_MODE=static` 後只觸發 Cloud Build，不得單獨改寫 live sitemap。
