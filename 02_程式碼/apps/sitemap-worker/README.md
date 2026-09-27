# Sitemap 發布服務

> `PUBLIC_RELEASE_MODE=static` 啟用後，本服務不再單獨發布 sitemap。它會合併 Firestore 事件，從指定的私有 Cloud Storage source archive 建立 Cloud Build；Cloud Build 產生同一份 HTML、sitemap 與 robots 的 Hosting candidate，再呼叫 `/deploy-static` 經原有佇列發布。詳細切換條件見 `../../02_規劃書/update/2026-09-19-static-hosting/`。

正式入口維持 `https://tiancinge-web.web.app/sitemap.xml`。Hosting 直接供應 XML 與 robots，不在每次爬取時查詢 Firestore。此服務為獨立 Node.js 程式，與 Next.js 的渲染生命週期分離。

## 更新流程

1. Eventarc 監聽 `articles`、`services`、`pricing_plans`、`article_categories`、`site_settings` 的建立、更新、刪除。
2. 私有 Cloud Run `/events` 將同一分钟的事件合併為一個 Cloud Tasks 任務，在該分鐘結束時執行。後台儲存不等待這個流程。
3. `sitemap-publish` 佇列最多同時執行一件發布。worker 從 Firestore 唯讀交易取得一致資料，套用公開條件。
4. 複製目前 live Hosting 版本，替換兩份檔案，保留其他資產與設定。完整上傳、finalize 之後才建立 release。
5. 文件 hash 沒變就跳過。一般更新目標為五分鐘內，包括事件傳送、合併、發布及最多 60 秒 CDN 快取；雲端服務失敗時無法保證此時間。
6. 最多嘗試五次（10–60 秒退避），每日台北時間 03:15 執行補檢。錯誤不會清空現有 sitemap。

## 文章排程發布

- 後台將排程文章保存為 `status=scheduled`，並以 UTC ISO-8601 儲存 `scheduledAt`；畫面輸入與顯示採台北時間。
- Cloud Scheduler 每分鐘以 OIDC 呼叫受 IAM 保護的 `POST /scheduled-publications`。
- worker 只將到期且未刪除的文章切換為 `published`，以排程時間換算台北發布日期，然後排入既有完整靜態站重建佇列。
- 排程時間到達後仍需等待 Cloud Scheduler、Cloud Build、Hosting release 與 CDN 更新，正常不是秒級公開。

部署 worker 後，以目前 `sitemap-daily-repair` 相同的 OIDC service account 建立每分鐘工作：

```sh
WORKER_URL="$(gcloud run services describe tiancinge-sitemap --project tiancinge --region asia-east1 --format='value(status.url)')"
SCHEDULER_SA="$(gcloud scheduler jobs describe sitemap-daily-repair --project tiancinge --location asia-east1 --format='value(httpTarget.oidcToken.serviceAccountEmail)')"
gcloud scheduler jobs create http article-scheduled-publications --project tiancinge --location asia-east1 --schedule='* * * * *' --time-zone='Asia/Taipei' --uri="${WORKER_URL}/scheduled-publications" --http-method=POST --oidc-service-account-email="${SCHEDULER_SA}" --oidc-token-audience="${WORKER_URL}"
```

## 收錄規則

- 固定頁：首頁、服務列表、消息列表、部落格列表；隱私權政策與服務條款仍可直接存取，但依 SEO 優先順序不列入 sitemap。
- 服務：`isVisible=true` 且 slug 通過公開格式檢查。
- 價目：`pricing_plans` 中 `isVisible=true` 的項目進入公開快照；首頁推薦由 `showOnHome` 與 `homeSortOrder` 控制，完整價目表使用 `sortOrder`。
- 文章：`status=published`，且 type 為 news 或 blog。
- 分類頁可供站內瀏覽，但分類首頁與分類分頁都不列入 sitemap。
- 編輯政策頁：作者介紹與編輯政策皆有內容才收錄。
- 排除草稿、隱藏服務、所有分類網址、搜尋結果、後台、API、hash 錨點。刪除或下架後會移除。
- `lastmod` 使用內容的時間；無效或未來時間省略。相同輸入不因執行時間而改變。

## 部署入口

目前公開 web 的一般發布使用靜態產物入口：

```sh
pnpm build:web:static <private-snapshot.json> <static-artifact-dir>
pnpm deploy:web:static <static-artifact-dir> <private-snapshot.json>
```

腳本先用 `firebase.static.json` 部署一天到期的 preview channel，再將不可變版本排入同一佇列。worker 以同一份 public snapshot 建置與驗證 HTML、robots、sitemap 後發布。序號防止較舊部署晚到時覆蓋新部署。不要直接使用 `firebase deploy` 覆寫 web live，也不要設定 `SITEMAP_STAGING=1` 繞過入口；管理後台的獨立 Hosting target 不受影響。

Cloud Run 的 API／管理服務部署仍使用既有建置流程；公開 web 不再由 SSR catch-all 提供，也不要直接用 Firebase CLI 發布 web live。更動 worker 使用：

```sh
gcloud run deploy tiancinge-sitemap --project tiancinge --region asia-east1 \
  --source apps/sitemap-worker \
  --build-service-account projects/tiancinge/serviceAccounts/tiancinge-cloudbuild@tiancinge.iam.gserviceaccount.com
```

保留服務既有 IAM、環境變數、concurrency=1、max-instances=1、timeout=150 設定。工作內部發布截止 120 秒；Cloud Tasks deadline=180 秒。所有發布端點均受 Cloud Run IAM 保護，不提供公開匿名寫入。

## 維運與驗證

```sh
pnpm test:sitemap
python3 scripts/verify-sitemap.py
gcloud tasks list --project tiancinge --location asia-east1 --queue sitemap-publish
gcloud run services logs read tiancinge-sitemap --project tiancinge --region asia-east1 --limit 30
gcloud scheduler jobs run sitemap-daily-repair --project tiancinge --location asia-east1
```

Firestore `_sitemap/status` 保存最近檢查時間、網址數、版本、前版本與錯誤。`_sitemap/sequence` 只供發布排序。日誌不含文章內容、登入 token 或帳戶憑證。`/status` 需要 IAM 身分權限。

測試覆蓋收錄條件、中文 URL、重複資料、日期、讀取失敗、clone/upload/finalize 失敗、外部發布衝突、亂序部署、相同內容不發布、合併與重试。公開驗證腳本檢查 GET/HEAD、XML MIME、XML parser、robots 及每一個網址的 HTTP/canonical/noindex。

## 回滾

靜態版本回滾必須使用與 HTML、robots、sitemap 同一組的已驗證 Hosting release；目前沒有把新建置誤當回滾的 CLI shortcut。如果 worker 本身故障，先暫停 `sitemap-publish` 佇列，確認沒有執行中的發布，再由具 Hosting 權限的維運者依 `_sitemap/status.previousVersion` 透過 Firebase Hosting release history 回滾。確認網站與 XML 後恢復佇列；修復前不要以空 XML 取代現有文件。回滾完成後需補記 release ID、檢查結果與原因。

## Search Console

使用 URL-prefix property `https://tiancinge-web.web.app/`，提交 `sitemap.xml` 一次。網站驗證成功並不代表 Google 已重新爬取；保留 Google 顯示的最後讀取時間與錯誤供後續判斷，避免反覆刪除重送。
