# Firebase Hosting 靜態發布遷移

本更新把官網公開內容改為「Firestore 快照 → 完整靜態 HTML → Firebase Hosting」的發布模型。Cloud Run 保留給聯絡表單與管理 API；它不再是訪客取得公開頁面的必要節點。

## 已完成的程式基礎

- 公開快照只保留可見服務、已發布文章、公開分類與公開設定；草稿、留言、帳密、稽核與內部備註無法進入建置輸出。
- Next.js 可由快照產生首頁、服務、文章、分類、列表、分頁、法律頁、搜尋頁與每頁 metadata/canonical。
- 靜態產物完成後才寫入 sitemap.xml 和 robots.txt，並檢查每個 sitemap URL 的 HTML、main、title、description、canonical 與 noindex。
- 靜態 Hosting 全站回應已加入 `Content-Security-Policy-Report-Only`、`X-Frame-Options`、`Permissions-Policy`、`Referrer-Policy` 與 `X-Content-Type-Options`；CSP 先以觀察模式發布，待真實流量確認沒有誤擋後才評估 enforce。
- Cloud Tasks 佇列新增 static candidate 發布模式；一次發布 HTML、RSC 資料、搜尋資料、robots 與 sitemap，不再由舊程序事後覆寫 sitemap。
- `firebase.static.json` 專供新靜態官網的 staging 候選版本使用；正式 `firebase.json` 仍保留管理後台與 API 設定，公開 web live 由 static candidate 經 worker 發布。

## 已啟用的雲端設定

目前專案沒有可用的 Git 來源連線，因此使用既有的私有 Cloud Build bucket 保存「可重現的程式原始碼封存」。每次程式碼變更後先上傳封存，再把不可變的 object generation 設到 sitemap worker。Firestore 事件便能直接建立一個 Cloud Build，而不需要讓 Cloud Build 讀取工作站或公開 repository。

正式環境已將下列來源設定設到 sitemap worker：

```text
PUBLIC_RELEASE_MODE=static
STATIC_BUILD_SOURCE_BUCKET=tiancinge_asia-east1_cloudbuild
STATIC_BUILD_SOURCE_OBJECT=static-site/source-<sha256>.tar.gz
STATIC_BUILD_SOURCE_GENERATION=<GCS generation>
```

`pnpm upload:web:static-source` 建立該來源封存；它只包含網站、共用 packages、sitemap worker、發布 scripts 與 lockfile，排除 Git 歷史、`node_modules`、建置產物、環境檔與私鑰。`cloudbuild.yaml` 指向私有 `tiancinge-sitemap` Cloud Run URL。Cloud Build service account 需有 Firestore 唯讀、Firebase Hosting 發布與呼叫該私有 worker 的權限；worker service account 只取得建立 Cloud Build 與代入指定 build service account 的權限。

首次 preview 已完成 HTML、canonical、robots 與 sitemap 驗收後，worker 的 `STATIC_BUILD_STAGE_ONLY` 已改為 `0`。後續 Firestore 事件會自動建立靜態 candidate 並經佇列發布正式版。

靜態發布啟用後，舊 SSR catch-all rewrite 已由 static Hosting version 取代；Cloud Run 只保留 `/api/contact` 與管理 API。

## 操作入口

```sh
# 本機或 Cloud Build：先取得私有快照
node scripts/export-public-snapshot.mjs /private/public-snapshot.json

# 建出完整靜態官網、robots 和 sitemap
pnpm build:web:static /private/public-snapshot.json /private/static-site

# 程式修改後，產生可供 Cloud Build 使用的來源封存
pnpm upload:web:static-source

# 建立一天有效的 Hosting preview candidate，排入 private worker 發布佇列
pnpm deploy:web:static /private/static-site /private/public-snapshot.json
```

不要把 `/private/public-snapshot.json`、`build/static-web` 或 Cloud Build 的私人工作目錄提交到 Git 或部署至 Hosting。

請依序閱讀 [架構與發布規劃](architecture.md)、[Terra 工作卡](terra-tasks.md) 與 [驗收與切換清單](release-checklist.md)。
