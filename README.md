# 天心閣養生會館

天心閣養生會館官網與內容管理後台。前台以 Next.js 16／TypeScript 建置並以 Cloud Run 動態伺服器渲染，後台以 React／Vite／TypeScript 建置並發布至 Firebase Hosting；資料層使用 Firebase Authentication、Cloud Firestore 與 Cloud Storage。共用資料契約與驗證位於 `packages/contracts`，共用設計變數位於 `packages/design-tokens`。在尚未設定 Firebase 環境變數時，前台與後台使用共用 fixture／localStorage 方便設計驗收。完整 Luna 任務卡位於 [`02_規劃書/project/luna-tasks-firebase.md`](02_規劃書/project/luna-tasks-firebase.md)。

## 啟動

```bash
pnpm install
pnpm run dev:web       # http://localhost:3000
pnpm run dev:admin     # http://localhost:5173
```

本機 Firebase 設定使用 `apps/web/.env.local` 的 `FIREBASE_PROJECT_ID`、`FIREBASE_STORAGE_BUCKET`，以及 `apps/admin/.env.local` 的 `VITE_FIREBASE_*` 與 `VITE_WEB_URL`。正式前台使用 Cloud Run 的 Firebase Admin ADC，後台使用 Firebase Web SDK；Firestore 與 Storage Rules 只允許管理員寫入。管理員帳號由 Firebase Authentication 建立，並在 `admins/{uid}` 建立 allowlist 文件，再替換聯絡資訊、LINE 連結、地圖、SEO 及政策文字。

Firebase 部署與備份／回復策略請參考 [`02_規劃書/project/firebase-deployment.md`](02_規劃書/project/firebase-deployment.md)。Firestore 匯出使用 Google Cloud export/import；Storage 使用 Cloud Storage lifecycle 與版本化策略。

正式網站為動態渲染，後台儲存 Firestore 後重新整理官網即可看到更新，不需等待靜態頁面建置。Cloud Run 設為 min instances 0，低流量時不持續佔用執行個體。

正式資料、帳號、網域與店家內容請依 [`production-input-form.md`](02_規劃書/project/production-input-form.md) 填寫，再執行上線清單。每張 Luna 卡的提交與交接證據見 [`commit-map.md`](02_規劃書/project/luna-tasks/commit-map.md)。

部署前可執行 `pnpm preflight:production`，檢查七個官網／後台環境變數是否存在、網址格式是否正確；檢查不會輸出任何 key 值。

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

`test:e2e` 會使用本機 Chrome 執行 `e2e/` 內的公開頁與後台流程；若兩個 dev server 已啟動會重用現有服務。

## Firebase／GCP 部署

- Firebase project：`tiancinge`（region `asia-east1`）。
- 官網：Cloud Run service `tiancinge-web`，Firebase Hosting site `tiancinge-web` 以 rewrite 導向 Cloud Run，維持動態 SSR 與 SEO。
- 後台：Firebase Hosting site `tiancinge-admin`，建置輸出 `apps/admin/dist`。
- 資料：Firestore Native default database、Firebase Authentication、Storage bucket `tiancinge.firebasestorage.app`。
- 不要把任何 `.env` 檔或 service account key 提交到 repository。
