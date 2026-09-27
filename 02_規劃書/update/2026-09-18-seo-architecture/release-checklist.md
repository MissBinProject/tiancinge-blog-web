# SEO 架構發布清單

- [x] 所有 Luna 卡的交接紀錄完成，任務卡驗證器通過 63 張卡；新增欄位與 Firestore 索引已部署到 staging／正式流程。
- [x] staging 通過 SSR、404、robots、sitemap、JSON-LD、圖片、手機與管理員回歸；證據見 2026-09-20 release 與 Lighthouse 報告。
- [x] 草稿、隱藏服務與回收資料沒有出現在公開列表、搜尋、相關文章或 sitemap；由 public snapshot、sitemap worker 與回收測試共同驗證。
- [x] 現有文章、分類與既有 ID URL 保持可讀；semantic URL 遷移另列後續工作，未在本次變更中破壞舊網址。
- [x] 固定 image digest 建立 Cloud Run staging revision，並完成 1% 流量、Cloud Logging 與回切驗證。
- [x] 保留前一個正式 revision，完成 staging 回退演練後才切正式流量；正式回退仍保留受控 SOP。
- [x] 正式部署後抽查首頁、三類列表、三類詳情、分類、搜尋、robots、sitemap 與 404。
- [ ] 在 Search Console 記錄 property、sitemap 提交時間、最新讀取狀態與後續第 7／28 天檢查日期。
- [x] 報表仍顯示無法擷取時，已保留 HTTP、Google 即時檢查及 Cloud Logging 證據，沒有直接修改 XML 猜測性修復；後續等待 Google 非同步處理。
