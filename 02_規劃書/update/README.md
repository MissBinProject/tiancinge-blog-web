# 更新紀錄

- [待發布文章價格核對（2026-09-22）](2026-09-22-blog-price-audit.md)：核對本機 24 篇草稿與正式價目表 13 個方案；6 篇更正價格、1 篇更正時長、熱石養生 1 篇撤除舊報價並暫緩發布。

- [部落格分類與日期發佈計劃（2026-09-21）](2026-09-21-blog-editorial-plan.md)：四個主分類、12 週 24 篇日期排程、素材需求與發布驗收；尚未上稿或設定自動發布。

- [Firebase Hosting 靜態發布遷移（2026-09-19）](2026-09-19-static-hosting/README.md)：公開快照、靜態 HTML／sitemap 同版產物、Cloud Build、IAM、preview、正式發布與回退證據均已完成；目前保留 CSP Report-Only 觀察與後續 24 小時正式流量驗收。

- [Sitemap 穩定化與自動更新（2026-09-19）](2026-09-19-sitemap-stabilization.md)：靜態 Hosting、事件更新、統一發布佇列、重試及每日補檢已部署。Search Console 已重新提交，新的擷取結果尚待 Google 更新。

- [SEO 優化交付包](seo-optimization/README.md)：已完成現況稽核、核心技術修正與 [Luna 工作卡](seo-optimization/luna-tasks/README.md)，Search Console 提交待帳號持有人操作。
- [SEO 架構優化交付包（2026-09-18）](2026-09-18-seo-architecture/README.md)：依養生文章自然搜尋目標重新整理架構，含優化報告、資料契約、發布驗收與 [24 張 Luna 工作卡](2026-09-18-seo-architecture/luna-tasks/README.md)。
- [資料安全優化交付包](data-security/README.md)：已完成 P0 個資殘留、body/multipart 限制、Cloud Run 最小權限、Firestore 每日備份/刪除保護、Storage 版本化、session/限流、圖片重編碼、內容版本、回收標記與基礎稽核；含 [Luna 工作卡](data-security/luna-tasks/README.md) 規劃後續 MFA 註冊、恢復演練、CSP enforce、依賴與備份演練。

針對既有功能的錯誤、校稿與客戶回饋，請以 `YYYY-MM-DD-short-issue-name.md` 建立紀錄。

- [後台一般帳號密碼登入修改規劃](username-login/修改程式規劃書.md)：帳號密碼登入、伺服器 session、後台資料 API 與回退流程已實作；正式 Firebase 憑證登入與完整後台 CRUD 驗收仍依清單執行。
- [移除 Authentication、改用伺服器帳密](2026-09-15-server-account/修改規劃書.md)：核心實作與正式部署完成，含 [35 張 Luna 任務卡](2026-09-15-server-account/luna-tasks/README.md) 與驗收發布清單。
