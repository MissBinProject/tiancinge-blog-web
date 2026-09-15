# 2026-09-15 回歸補強與 Firebase 發布

## 現行正式環境

- Firebase/GCP project `tiancinge` 已建立；官網以 Cloud Run 動態 SSR，後台以 Firebase Hosting 發布。
- Firestore、Storage Rules、Email/Password Authentication 與 `admins/{uid}` allowlist 已發布；後台登入帳號為 `tiancinge`，Firebase 恢復信箱為 `ouyangtaisen@gmail.com`。
- 公開站：<https://tiancinge-web.web.app>；後台：<https://tiancinge-admin.web.app>。
- 服務、最新消息與部落格的公開 URL 已改為 10 位小寫英數亂碼；管理後台提供新聞／部落格獨立分頁、清單搜尋分頁、Tiptap 編輯器與圖片上傳選擇器。
- 最終 Cloud Run revision：`tiancinge-web-00005-mhs`；提交：`76113be`。

- 視覺基準腳本等待頁面圖片、跨來源地圖 iframe 與聯繫區 settling window；連續兩次 `VISUAL_BASE_URL=http://localhost:3000 pnpm visual:capture` 的五張 current SHA-256 一致，再以 `pnpm visual:diff` 重新產生 overlay／difference。相關提交：`ded03d4`、`2ee56d8`。
- Firebase client SDK 已驗證匿名 Firestore 讀取遭 Rules 拒絕；管理員登入後可讀取服務與文章，正式寫入仍以後台操作流程驗收。
- 依 UI 配置矩陣補上 768px 平板版面：服務／消息／部落格內頁列表改為兩欄，服務詳情與聯繫區改為上下排列；Playwright 新增斷點驗收，提交 `fe75ebc`。
- 後台 Auth 登入、session／管理員 allowlist 驗證、登出與密碼重設改由 `apps/admin/src/auth.ts` adapter 提供，畫面元件不直接查詢管理員資料表。
- 修正 Auth 初次 session 權限查詢與手動登出的競態，加入 request 世代／元件卸載防護並覆蓋 `SIGNED_IN` 重新驗證；相關提交：`1dd44f9`。
- 本輪回歸：web/admin 型別檢查、web Vitest（6／6）、公開 Playwright（11／11）、Firebase task-card 驗證（63／63）及 `git diff --check` 通過；後台 Playwright 需提供 `E2E_ADMIN_EMAIL`／`E2E_ADMIN_PASSWORD` 才執行，未提供時會安全跳過，避免把正式管理員密碼寫入測試。
- E10／E11 尚待店家正式文案、原始字型／照片、Firestore export／Storage 版本化備份演練與自訂網域；目前已完成 Firebase/GCP 部署與公開 smoke test。
