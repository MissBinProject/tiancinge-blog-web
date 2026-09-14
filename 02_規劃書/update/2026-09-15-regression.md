# 2026-09-15 回歸補強

- 視覺基準腳本等待頁面圖片、跨來源地圖 iframe 與聯繫區 settling window；連續兩次 `VISUAL_BASE_URL=http://localhost:3000 pnpm visual:capture` 的五張 current SHA-256 一致，再以 `pnpm visual:diff` 重新產生 overlay／difference。相關提交：`ded03d4`、`2ee56d8`。
- `supabase/scripts/verify-local.sh` 增加已登入但不在 `admin_users` 的 `member_user`，驗證非管理員無法讀取留言／草稿／隱藏服務，也不能新增、修改或刪除內容與網站設定。`pnpm db:verify` 通過，相關提交：`d07c55d`、`670ac83`、`4d7dc39`、`4b5a572`。
- 依 UI 配置矩陣補上 768px 平板版面：服務／消息／部落格內頁列表改為兩欄，服務詳情與聯繫區改為上下排列；Playwright 新增斷點驗收，提交 `fe75ebc`。
- 本輪回歸：`pnpm run typecheck`、`pnpm run build`、`pnpm test`（13／13）、`pnpm test:e2e --workers=1`（23／23）、`pnpm db:verify`、`pnpm db:backup:verify`、`pnpm tasks:verify`、`pnpm assets:export`、`git diff --check` 均通過。
- E10／E11 仍待正式 Supabase、Vercel、Auth 管理員、店家正式資料、原始字型／照片及正式備份環境；不可將本機 fixture 驗收標記為正式上線完成。
