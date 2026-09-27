# 驗收與切換清單

## Preview 必須通過

- [x] Cloud Build 使用實際 Firestore 公開快照，並輸出 digest、版本與 17 個 URL；最新正式 Hosting release 識別見 `2026-09-20-seo-indexability/evidence/final-release-2026-09-20.md`。
- [x] `pnpm test:sitemap`、`pnpm --filter @tian-xin-ge/web typecheck`、`pnpm build:web:static`（Cloud Build）成功；目前 Web 測試 49 項通過。
- [x] sitemap 每個 URL 均為 200、含唯一 canonical、title、description、H1 與主要 HTML 內容；`pnpm seo:audit` 通過 17 個 URL。
- [x] robots 指向絕對 sitemap URL；sitemap、HTML、RSC 均由同一靜態 candidate 產生。
- [x] `/api/contact` method guard 與匿名錯誤回應通過；管理後台 API 未登入均回 401。
- [ ] 具正式管理員測試資料的登入、媒體上傳與聯絡留言完整流程仍需維運者執行。
- [x] 未知網址回傳 404；公開頁沒有 `**` → Cloud Run fallback；`pnpm seo:baseline` 通過。
- [x] 草稿、內部備註、管理員資料與 private snapshot 不在 Hosting release；公開快照白名單與 release 測試通過。
- [x] 建置失敗、重送事件、候選亂序與發佈衝突都保留舊 live release；sitemap worker 測試通過。

## Live 切換

- [x] 確認 live release ID `sites/tiancinge-web/versions/6a41101ef0db7dd4`、release `1789885117455000`、snapshot digest、發布時間與前一版版本。
- [x] 已建立 Firebase/GCP 支出上限（Cloud Run NT$100、Gemini NT$1、Vertex AI NT$1）；Cloud Monitoring 錯誤通知政策仍需指定通知管道後建立。
- [x] 設定 `PUBLIC_RELEASE_MODE=static`、私有來源 object generation、專用 build service account 與 private worker URL。
- [x] 由 `firebase.static.json` 產生 candidate，並完成 HTML、canonical、robots、sitemap 與公開端點回歸核對。
- [x] 經同一佇列發布 live；不使用 `firebase deploy` 直接覆寫 web live。
- [x] 重新提交 `https://tiancinge-web.web.app/sitemap.xml`，並保留 Search Console 提交與待處理紀錄。
- [x] 已完成 staging 1% 觀察與受保護 Cloud Run revision 回切；證據見 `../data-security/evidence/2026-09-20-staging-rollback.md`。
- [ ] 正式 Hosting 緊急下架演練仍需安排維運窗口，避免影響現行訪客流量。
