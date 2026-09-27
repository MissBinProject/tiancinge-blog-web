# 驗收清單

所有項目初始未驗收；不可沿用昨日結果打勾。

- [x] A01：HEAD/GET/UA/匿名、XML、robots、redirect、404 證據齊全。
- [x] A02：GSC property 與讀取時間已核對；目前狀態為「無法擷取」，詳細頁顯示「無法讀取 Sitemap」，網站端未能重現錯誤，根因明列為 Google 端未提供可操作錯誤碼。證據見 `evidence/a02-gsc-followup-2026-09-20.md`。
- [x] B01：全站 sitemap 與內鏈發現路由已由 `pnpm seo:audit` 稽核，soft-404 候選保留人工內容審核。
- [x] B01：可用 `SEO_AUDIT_TABLE=1 pnpm seo:audit` 輸出逐路由 URL、HTTP、robots、canonical、title、H1 與結果表格。
- [x] 首頁 canonical 保持原值；重要頁 HTTP 200、自 canonical、無 meta/header noindex。
- [x] 爬蟲 HTML 含正文與 H1，重要詳情由標準 a[href] 可達。
- [x] C：不變儲存/建置不更新 lastmod；公開快照保持內容日期；草稿/隱藏/刪除/中文 URL 規則測試。
- [x] 移出 sitemap 的法律頁保持可讀；薄分類決策有逐頁理由。
- [ ] D/E：資料經確認，無假電話、過期優惠誤導、重複 alt 或虛构評價。
- [x] pnpm test:sitemap、受影響 web 測試、web typecheck 與 git diff --check 通過。
- [x] 靜態建置與 preview 整合驗收通過；手機內容可讀性仍需人工裝置回歸。
- [x] Playwright E2E：13 tests passed（公開站 11、帳號登入安全流程 2），覆蓋 390px／768px 版面、水平溢出、手機選單、服務／消息／部落格／政策頁；19 個需要管理員測試資料的案例依設定略過。
- [x] 正式端點重驗通過；GSC 結果另列外部待驗收。
- [x] 靜態 Hosting 回應含 CSP Report-Only、X-Frame-Options、Permissions-Policy、Referrer-Policy 與 X-Content-Type-Options；CSP 尚未 enforce。

測試依現有 package scripts 與 fixture 執行，記錄命令，不將這份清單視為測試已跑。不得把 HTTP 200 等同 Google 已收錄。
