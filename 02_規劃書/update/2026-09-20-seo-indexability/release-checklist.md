# 發布與回退清單

- [x] 記錄當前 live Hosting 版本、來源 object/generation 與設定；保留可回復版本。證據見 `evidence/final-release-2026-09-20.md`。
- [x] 僅打包已驗收程式；工作區有其他變更時先檢查範圍，避免把未驗證內容一起發布。
- [x] 公開快照與靜態 HTML/sitemap 同一版本；所有 preview 稽核通過。
- [x] 依當前 apps/sitemap-worker/README.md 與靜態發布工具操作；不要照舊文件直接 firebase deploy。
- [x] 更新不可變 static source archive 引用，確保自動內容建置不再用舊程式。
- [x] 通過既有發布佇列與候選版本流程，保留 API rewrite；不手工覆寫 live XML。
- [x] 公開首頁、服務／文章、404、robots/sitemap、聯絡功能的 HTTP 與 HTML 基本驗收。
- [x] 靜態 Hosting 已驗證 CSP Report-Only、X-Frame-Options、Permissions-Policy、Referrer-Policy 與 X-Content-Type-Options；CSP enforce 保留至觀察期後的安全變更。
- [ ] 出現錯 canonical、全站 noindex、主要 HTML 遺失、API 失效時停止後續發布並回復已驗證前版；回復也走受控流程。
- [x] GSC 已在正確 property 提交一次，並記錄提交成功訊息與提交後立即狀態；最後讀取與處理結果仍等待 Google 非同步回查，不能由網站端測試取代。

最終報告：根因或未確認證據缺口、修改檔案與原因、最終 robots、sitemap 生成方式、路由/header、canonical、逐 URL 稽核、curl 結果、未處理決策、發布版本。禁止只寫「SEO 已優化」。
