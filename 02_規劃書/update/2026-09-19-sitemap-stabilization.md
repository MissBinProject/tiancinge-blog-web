# Sitemap 穩定化與自動更新：實作與驗收

日期：2026-09-19（台北時間）。程式與正式部署完成；Google 重新擷取結果尚未更新。

> 歷史驗收紀錄：本文件保留 2026-09-19 的動態候選流程證據；目前公開 web 已依 [`2026-09-19-static-hosting/README.md`](2026-09-19-static-hosting/README.md) 切換為完整靜態 HTML Hosting。後續部署請以靜態流程為準。

## 修改結果

- `/sitemap.xml`、`/robots.txt` 改由 Firebase Hosting 靜態檔案供應。Next.js 同名動態路由已刪除，避免每次爬取依賴 SSR 或資料庫。
- `apps/sitemap-worker` 分離資料讀取、純產生規則、任務合併與 Hosting 發布。資料採一致的唯讀交易，任何來源失敗即停止。
- 四組 Eventarc 觸發器監聽文章、服務、分類與網站設定。60 秒內合併，透過單一發布佇列執行。
- Cloud Tasks 同時最多一件發布，最多五次嘗試、10–60 秒退避；每日 03:15（Asia/Taipei）Scheduler 補檢。
- 發布先 clone 現有資產、替換 XML/robots、finalize，最後才切換 release。外部版本衝突會停止重試，舊版本保持可用。
- 官網 Hosting 完整發布也走同一佇列，序號防止舊工作晚到時覆蓋新部署；這是本文件記錄的舊動態候選流程。
- 保留 19 個目前符合公開條件的網址；草稿、空分類與隱藏服務不收錄。內容沒變不重新發布。

## 驗收清單與證據

| 項目 | 結果與證據 |
|---|---|
| 純規則與發布故障測試 | 14 項 Node 測試通過，包含公開/草稿/刪除、分類、中文編碼、重複資料、日期、來源失敗、clone/upload/finalize 故障、發布衝突、亂序部署與合併 |
| 既有網站測試 | 11 個測試檔、38 項測試通過；Next 正式建置通過 |
| 正式靜態檔案 | GET、HEAD HTTP 200；`application/xml; charset=utf-8`；`Cache-Control: public, max-age=60`；XML parser 通過 |
| 與 SSR 分離 | Cloud Run 直接存取 `/sitemap.xml` 為 404，正式 Hosting 同路徑為 200 |
| 全部收錄網址 | `python3 scripts/verify-sitemap.py` 驗證 19 個網址：HTTP 200、沒有轉址、canonical 對應、沒有 noindex |
| Firestore 事件 | 09:47:04 接收到暫存草稿建立/刪除的兩個事件；09:48:00 合併工作完成，維持 19 個網址並跳過不必要發布。暫存草稿已刪除，未公開 |
| 首次靜態發布 | 09:47:09 發布 `sites/tiancinge-web/versions/e712a338eb6cb10b` |
| 完整 Hosting 發布 | `node scripts/deploy-web-hosting.mjs` 經 preview、佇列序號 1 完成；09:50:30 發布 `sites/tiancinge-web/versions/9caa47c3ddc8a8f6` |
| 每日補檢 | Scheduler 手動執行成功；09:55:01 worker 回報 unchanged、19 個網址；佇列已清空 |
| 回滾演練 | 在 preview channel `queued-c43af63e` 切換版本，再回到上一個版本，均核對成功。正式 live 版本未被演練更動；preview 一天到期 |
| 端點保護 | 未登入呼叫 worker `/status` 回傳 403；worker 使用服務帳號，不含私鑰；直接 web 部署 guard 回傳拒絕訊息 |
| 新服務依賴 | worker npm audit：0 vulnerabilities，uuid 固定 11.1.1 |
| Search Console | 正確 URL-prefix property 下重新提交 `sitemap.xml` 一次，Google 顯示「已成功提交 Sitemap」，送出日期更新為 2026-09-19 |

## 部署版本與權限

- 官網 Cloud Run：`tiancinge-web-00035-xp6`。
- sitemap worker：`tiancinge-sitemap-00004-bxc`。
- Worker IAM：Firestore 資料讀寫（含自身狀態）、Hosting 發布、Cloud Tasks enqueue；僅對既有 `tiancinge-web` 授予 Run viewer，讓 Hosting 驗證 rewrite。
- 觸發帳號只負責 Eventarc 接收、Cloud Run 呼叫；worker 可用該帳號建立 OIDC 任務。建置沿用既有專用 Cloud Build 帳號。
- 執行設定：concurrency 1、revision max instances 1、HTTP timeout 150 秒；內部發布截止 120 秒、task deadline 180 秒。

## Google 尚待更新

重新提交後，列表仍顯示「無法擷取」，沒有新的讀取時間，探索頁數為 0。提交成功不等於重新擷取成功；本次不能宣稱 Google 已通過或已收錄。

舊端點先前也曾回傳合法 XML，因此沒有證據證明原問題只是 XML 格式。本次消除的是爬取時依賴 SSR/Firestore 的可用性風險，並完成自動更新。後續以 Search Console 新的讀取時間與結果判斷，不需反覆刪除重送。

## 維護入口

- 公開 Sitemap：https://tiancinge-web.web.app/sitemap.xml
- robots：https://tiancinge-web.web.app/robots.txt
- 操作文件：`apps/sitemap-worker/README.md`。
- 目前一般發布：`pnpm deploy:web:static <static-artifact-dir> <private-snapshot.json>`，詳見 [`2026-09-19-static-hosting/README.md`](2026-09-19-static-hosting/README.md)。
- 舊動態流程回滾命令僅供歷史版本查證，不得用來覆寫目前靜態 web live；靜態回滾由 sitemap worker 以已驗證 Hosting version 執行。
- 狀態：Firestore `_sitemap/status` 與 Cloud Run 的 `sitemap_checked` / `sitemap_failed` 日誌。

一般更新目標為五分鐘內，已驗證事件合併正常；Google 排程、雲端故障、配額或帳單服務暫停均不在這個時效保證內。發生更新失敗時，最後成功的靜態版本繼續供應。
