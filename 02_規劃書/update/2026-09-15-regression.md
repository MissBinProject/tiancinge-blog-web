# 2026-09-15 回歸補強與 Firebase 發布

## 現行正式環境

- Firebase/GCP project `tiancinge` 已建立；官網以 Cloud Run 動態 SSR，後台以 Firebase Hosting 發布。
- Firestore、Storage Rules、Email/Password Authentication 與 `admins/{uid}` allowlist 已發布；管理員為 `ouyangtaisen@gmail.com`。
- 公開站：<https://tiancinge-web.web.app>；後台：<https://tiancinge-admin.web.app>。
- 服務、最新消息與部落格的公開 URL 已改為 10 位小寫英數亂碼；管理後台提供新聞／部落格獨立分頁、清單搜尋分頁、Tiptap 編輯器與圖片上傳選擇器。
- 最終 Cloud Run revision：`tiancinge-web-00005-mhs`；提交：`76113be`。

- 視覺基準腳本等待頁面圖片、跨來源地圖 iframe 與聯繫區 settling window；連續兩次 `VISUAL_BASE_URL=http://localhost:3000 pnpm visual:capture` 的五張 current SHA-256 一致，再以 `pnpm visual:diff` 重新產生 overlay／difference。相關提交：`ded03d4`、`2ee56d8`。
- `supabase/scripts/verify-local.sh` 增加已登入但不在 `admin_users` 的 `member_user`，驗證非管理員無法讀取留言／草稿／隱藏服務，也不能新增、修改或刪除內容與網站設定。`pnpm db:verify` 通過，相關提交：`d07c55d`、`670ac83`、`4d7dc39`、`4b5a572`。
- 依 UI 配置矩陣補上 768px 平板版面：服務／消息／部落格內頁列表改為兩欄，服務詳情與聯繫區改為上下排列；Playwright 新增斷點驗收，提交 `fe75ebc`。
- 後台 Auth 登入、session／管理員 allowlist 驗證、登出與密碼重設改由 `apps/admin/src/auth.ts` adapter 提供，畫面元件不再直接查詢 `admin_users`；相關提交：`e0aab0b`。
- 修正 Auth 初次 session 權限查詢與手動登出的競態，加入 request 世代／元件卸載防護並覆蓋 `SIGNED_IN` 重新驗證；相關提交：`1dd44f9`。
- 本輪回歸：`pnpm run typecheck`、`pnpm run build`、`pnpm test`（13／13）、`pnpm test:e2e --workers=1`（24／24，含後台主要模組 390px 溢出）、`pnpm db:verify`、`pnpm db:backup:verify`、`pnpm tasks:verify`、`pnpm assets:export`、`git diff --check` 均通過。
- E10／E11 仍待正式 Supabase、Vercel、Auth 管理員、店家正式資料、原始字型／照片及正式備份環境；不可將本機 fixture 驗收標記為正式上線完成。
