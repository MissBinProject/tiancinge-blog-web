# 技術計畫

- `apps/web` 使用 Next.js App Router、TypeScript；目前以固定 class 命名的全域樣式檔維持設計稿疊圖精度，公開頁面採伺服器渲染。
- `apps/admin` 使用 React、Vite、TypeScript；正式登入呼叫 Cloud Run server account API，由伺服器驗證密碼雜湊、session、CSRF 與來源；瀏覽器不保存 Firebase 管理員憑證。
- `packages/contracts` 保存 domain types；`packages/design-tokens` 保存官網與後台共用的色彩、字型、間距及圓角變數；官網以 `globals.css` 維持設計稿基準與 reset，互動元件的可及性樣式使用 CSS Modules（例如 `Header.module.css`）；畫面透過 repository／use case 使用資料。
- Cloud Firestore 保存網站設定、服務、分類、文章與留言；Cloud Storage 保存素材。Firestore Rules 與 Storage Rules 只允許管理員寫入，公開內容由 Cloud Run 的 Firebase Admin SDK 讀取。
- 官網部署於 Cloud Run `asia-east1`，使用 Next.js 動態 SSR；Firebase Hosting `tiancinge-web` 只負責 CDN、TLS 與 rewrite。後台為 Vite 靜態檔，部署於 Firebase Hosting `tiancinge-admin`。
- 所有服務／文章 URL code 由共用 `createContentCode()` 產生，格式固定為 10 位小寫英數亂碼；管理表單只讀不可手動修改。
- 開發無環境變數時使用 fixture，確保視覺任務不需等待資料庫。
