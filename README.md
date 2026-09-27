# 天心閣養生會館

官網公開內容採「Firestore 快照 → 完整靜態 HTML → Firebase Hosting」發布。請依 [靜態 Hosting 發布遷移](02_規劃書/update/2026-09-19-static-hosting/README.md) 使用 `pnpm deploy:web:static` 建立候選版本，再由 sitemap worker 排入發布佇列；不要使用舊的整站 Cloud Run rewrite 流程。自動更新、驗證與回滾方式見 [Sitemap 發布服務](apps/sitemap-worker/README.md)。

天心閣養生會館官網與內容管理後台。前台以 Next.js 16／TypeScript 建置完整靜態 HTML 並發布至 Firebase Hosting；Cloud Run 僅處理聯絡表單、管理 API 與發布協調，不是訪客讀取公開頁面的必要節點。後台以 React／Vite／TypeScript 建置並發布至 Firebase Hosting；資料層使用 Cloud Firestore 與 Cloud Storage，後台登入由 Cloud Run 伺服器帳號密碼與安全 session 驗證。共用資料契約與驗證位於 `packages/contracts`，共用設計變數位於 `packages/design-tokens`。完整 Luna 任務卡位於 [`02_規劃書/update/2026-09-15-server-account/luna-tasks/README.md`](02_規劃書/update/2026-09-15-server-account/luna-tasks/README.md)。

## 啟動

```bash
pnpm install
pnpm run dev:web       # http://localhost:3000
pnpm run dev:admin     # http://localhost:5173
```

本機前台使用 `apps/web/.env.local` 的 `FIREBASE_PROJECT_ID`、`FIREBASE_STORAGE_BUCKET`；後台只需要 `VITE_WEB_URL` 與 `VITE_ADMIN_AUTH_SERVER`。正式建置由私有 public snapshot 產生前台 HTML、RSC 資料、搜尋資料、robots 與 sitemap；Firebase Hosting 供應公開頁面，只有 `/api/contact` 轉送 Cloud Run。後台 Hosting 將 `/api/admin/**` rewrite 至 Cloud Run。Firestore Rules 封鎖瀏覽器直接讀寫，Storage 僅開放公開圖片讀取，所有異動由伺服器完成。帳號與密碼雜湊分別存於 Cloud Run runtime env 與 Secret Manager，不進入前端或 Git。

Firebase 部署與備份／回復策略請參考 [`02_規劃書/project/firebase-deployment.md`](02_規劃書/project/firebase-deployment.md)。Firestore 匯出使用 Google Cloud export/import；Storage 使用 Cloud Storage lifecycle 與版本化策略。

費用防護已在 Google Cloud Billing 設定：`tiancinge` 的 Cloud Run 每月 NT$100，Gemini API 與 Vertex AI 各每月 NT$1，使用原生 Preview 支出上限達標後暫停指定服務的新用量。上限可能受帳務延遲影響，解除需由帳單管理員在 [預算與警告](https://console.cloud.google.com/billing/016915-3B65AD-1A05CA/budgets?project=tiancinge) 手動操作；詳細 ID 與限制見 [`02_規劃書/update/2026-09-15-billing-guard.md`](02_規劃書/update/2026-09-15-billing-guard.md)。

後台儲存 Firestore 後，事件會在 60 秒合併窗口內觸發靜態重建；產物通過 canonical、metadata、robots、sitemap 與 HTML 驗證後才會切換 Hosting release。Cloud Run 設為 min instances 0，低流量時不持續佔用執行個體。

正式資料、帳號、網域與店家內容請依 [`production-input-form.md`](02_規劃書/project/production-input-form.md) 填寫，再執行上線清單。每張 Luna 卡的提交與交接證據見 [`commit-map.md`](02_規劃書/project/luna-tasks/commit-map.md)。

後台一般帳號登入修改的規劃與進度見 [`02_規劃書/update/username-login/修改程式規劃書.md`](02_規劃書/update/username-login/修改程式規劃書.md)。本機可用下列命令驗證帳號畫面（會暫時清空 Firebase Vite 變數，避免連到正式資料）：

移除 Firebase Authentication、改用伺服器帳密的規劃與實作進度見 [`02_規劃書/update/2026-09-15-server-account/修改規劃書.md`](02_規劃書/update/2026-09-15-server-account/修改規劃書.md)。目前伺服器帳密、session、登入 API、全部管理 API、後台 HTTP adapter、Hosting rewrite、Rules、provider 停用與回退演練均已完成；桌機像素差異另依原始設計稿簽核。

正式 Firebase 登入與密碼重設的人工驗收步驟見 [`02_規劃書/update/username-login/正式Firebase驗收操作.md`](02_規劃書/update/username-login/正式Firebase驗收操作.md)。

```bash
VITE_FIREBASE_API_KEY= VITE_FIREBASE_AUTH_DOMAIN= VITE_FIREBASE_PROJECT_ID= VITE_FIREBASE_APP_ID= pnpm exec playwright test --config=playwright.admin.config.ts --workers=1
```

部署前可執行 `pnpm preflight:production`，檢查官網／後台目前使用的 Firebase、Cloud Run server-account 與登入設定是否存在、網址格式是否正確；檢查不會輸出任何 key 值。

若要依設計稿座標重新產生暫用卡片素材，可執行 `pnpm assets:export`。

若要產生五個桌機區段的設計稿疊圖與像素差異定位圖，先確定官網 dev server 已啟動，再執行 `pnpm visual:capture && pnpm visual:diff`；輸出位於 `02_規劃書/project/visual-baseline/`。

若要檢查 Luna 任務卡是否仍保有完整欄位及 A01–E11 唯一 ID，可執行 `pnpm tasks:verify`。

可執行 `node --experimental-strip-types apps/web/scripts/seed-firebase.ts` 將 fixture 匯入目前 gcloud 專案；正式執行前請確認專案、帳號與備份目標。

## 驗證

```bash
pnpm run typecheck
pnpm run build
pnpm test
pnpm test:e2e
```

`test:e2e` 會使用本機 Chrome 執行 `e2e/` 內的公開頁與後台流程；若兩個 dev server 已啟動會重用現有服務。後台 Firebase 流程需先設定 `E2E_ADMIN_PASSWORD`，帳號預設為 `tiancinge`，也可用 `E2E_ADMIN_USERNAME` 覆寫；未設定密碼時後台案例會跳過，不把正式密碼寫入測試。

## Firebase／GCP 部署

- Firebase project：`tiancinge`（region `asia-east1`）。
- 官網：Firebase Hosting site `tiancinge-web` 供應完整靜態 HTML；Cloud Run service `tiancinge-web` 僅提供 `/api/contact` 與後台管理 API，Cloud Run service `tiancinge-sitemap` 負責快照建置、候選版本與發布佇列。
- 後台：Firebase Hosting site `tiancinge-admin`，建置輸出 `apps/admin/dist`。
- 資料：Firestore Native default database、Storage bucket `tiancinge.firebasestorage.app`；管理登入由 Cloud Run server account 處理。
- 不要把任何 `.env` 檔或 service account key 提交到 repository。公開官網部署請使用 `pnpm deploy:web:static <static-artifact-dir> <private-snapshot.json>`；`pnpm deploy:web:hosting` 僅保留為舊動態流程的歷史腳本，不應再用來發布公開 web。
