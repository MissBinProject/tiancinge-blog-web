# Firebase 動態版本實作規劃

## 已決策

- 專案：`tiancinge`，帳號：`ouyangtaisen@gmail.com`，區域：`asia-east1`。
- 官網保留 Next.js App Router 伺服器渲染，部署至 Cloud Run；Firebase Hosting 只作 HTTPS、CDN 與網域入口，所有動態請求 rewrite 至 Cloud Run。
- 後台是 React/Vite 靜態站，獨立部署至 Firebase Hosting。
- 資料改用 Firestore；登入使用 Firebase Authentication；圖片使用 Cloud Storage for Firebase。
- 內容寫入後下一次官網請求立即讀取最新資料，不建立自動靜態建置流程。
- 網址代碼由共用系統產生 10 碼小寫英數字，建立後固定；後台欄位唯讀，無法手動輸入。

## 執行邊界

頁面元件只能呼叫 repository/use case；Firebase Admin SDK 只在 Cloud Run server code 使用，瀏覽器只使用 Firebase client SDK。Firestore 與 Storage 的直接瀏覽器讀寫只對通過 Firebase Authentication 且存在 `admins/{uid}` 的管理員開放，其他訪客一律由 Rules 拒絕。正式資料服務失敗時不得回退測試 fixture。

## 發布流程

程式變更由 Cloud Build 建置容器並部署 Cloud Run；內容變更只寫 Firestore／Storage。部署前執行 typecheck、build、Emulator rules test 及 Playwright。驗收站預設 `noindex` 並由伺服器檢查 session，正式資料核准後才解除保護。

## 成本控制

Cloud Run `min=0`、`max=2`；Cloud Build 保留最少映像；圖片限制 10MB 並優先 WebP；Firestore 查詢使用必要欄位與游標；GCP Budget 設 NT$300 通知。預算通知為警示，不是硬性上限。
