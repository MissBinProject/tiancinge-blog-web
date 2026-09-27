# 發布與驗收證據（2026-09-21）

- Firestore：`pricing_plans` 公開快照 13 筆；可見服務 4 筆。
- Firebase Hosting web：release `sites/tiancinge-web/releases/1789998974218000`，version `sites/tiancinge-web/versions/d0cbd9de53755757`，發布序號 43。
- Firebase Hosting admin：已發布包含「價目表」管理頁的最新 Vite bundle。
- Cloud Run API：revision `tiancinge-web-pricing-20260921` 100% traffic；未登入 `/api/admin/pricing` 回傳 401。
- Sitemap worker：自動建置來源已鎖定 `static-site/source-a31c0ebf0490b6727e28ae7660e806e80c88d30ceecac052cff37c82c4434ce2.tar.gz`，generation `1789999951425019`。
- 線上結果：`/pricing` HTTP 200、完整 HTML、唯一 H1、canonical 正確；sitemap 17 個 URL 且含 `/pricing`；robots.txt 含 sitemap 與 API／搜尋頁規則。
- 測試：Web 58 tests、sitemap worker 31 tests、typecheck、Admin production build 全部通過。
