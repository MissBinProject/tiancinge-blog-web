# 驗收清單

- [x] `pnpm run build`（web + admin）
- [x] `pnpm run typecheck`
- [x] `pnpm test`（fixture、公開內容與 Contact API 驗證）
- [x] `pnpm test:e2e --workers=1`（23 條公開／後台流程：四種 viewport、手機選單 ARIA／錨點、內頁手機溢出、內頁導覽目前區段、缺圖 fallback、404、表單成功／失敗保留內容、登入／登出／重設密碼輔助狀態、後台收合側欄 aria 名稱與目前頁面語意、預覽、正文圖片素材選擇、最新消息手動輪播與空白頁防護、首頁分類入口同步、價格卡 LINE 入口、設定、服務新增／排序／顯示狀態、文章建立／發布／刪除、素材／分類刪除保護、留言與離頁提醒、草稿公開限制）
- [x] 首頁、服務詳情、消息詳情、部落格詳情可載入
- [x] `POST /api/contact` 成功及必填欄位錯誤回應
- [x] `pnpm db:verify`（migration／seed、匿名／管理員 RLS、Storage、正文與圖片 URL constraint、留言限流／防重送 guard）
- [x] `pnpm db:backup:verify`（本機 custom-format 備份、checksum、資料異動後回復及服務／文章筆數驗證）
- [x] 桌機與手機 CSS 斷點及水平溢出規則
- [ ] Supabase Auth、RLS、Storage 在正式專案驗證
- [ ] 390／768／1440／1672px 截圖疊圖與設計稿逐區比對
- [ ] 正式網域、環境變數、備份與回復演練

本機 fixture 的五張 current、overlay 與 difference 圖已由 `pnpm visual:capture && pnpm visual:diff` 產生；正式勾選仍需店家提供原字型、原始卡片照片及確認文案後重跑。
