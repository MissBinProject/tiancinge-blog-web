# SEO 發布清單

- [x] 先備份 Firestore，確認只有 `n-draft` 的測試文章狀態改為 draft。
- [x] 本機測試與建置通過。
- [x] Cloud Run 新 revision `tiancinge-web-00021-sln` 通過健康檢查並切換 100% 流量。
- [x] 正式抽查首頁、服務、消息、部落格、三類詳情、sitemap、robots、404。
- [x] Search Console 已由具 property 權限的帳號完成 URL-prefix 驗證並提交 `https://tiancinge-web.web.app/sitemap.xml`；目前 Google 報表仍顯示「無法擷取」，等待非同步處理，詳見最新 SEO completion matrix。
- [ ] 發布後第 7 天與第 28 天檢查索引涵蓋、Core Web Vitals、404、sitemap 錯誤與內容更新。
- [x] 保留前一個 Cloud Run revision 作為回退版本。

Search Console 的提交已完成；第 7／28 天索引涵蓋、Core Web Vitals、404、sitemap 錯誤與內容更新檢查仍由維運者依 `2026-09-20-seo-indexability` 證據追蹤。Google 報表狀態不可由網站端測試替代。
