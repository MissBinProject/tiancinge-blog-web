# 天心閣 SEO／索引修正計畫

日期：2026-09-20。狀態：P0/P1 程式修正與正式發布完成；內容與 GSC 外部驗收待確認。2026-09-20 追加列表、分類與分頁頁面的 breadcrumb、獨立 metadata、服務摘要與詳細內容去重、服務 SEO title/description 欄位、服務流程／適用情境／注意事項／FAQ 選填欄位、靜態 Hosting CSP Report-Only 安全標頭、文章與服務內容品質提示，並重新發布；19:31 已以 service-detail helper 完成回歸、靜態 Hosting 同步及 sitemap worker source 更新，19:52 再同步 robots 搜尋頁排除規則，後續將法律頁與非 sitemap 工具頁納入 SEO baseline。稽核工具現在也會檢查圖片 alt、服務詳情正文長度、H1 文字重複與內鏈發現的非 sitemap 路徑。依據：使用者提供的修改報告、目前程式碼及 2026-09-20 正式站稽核。

## 目標與範圍

先查明 sitemap 無法擷取是否可在網站端重現，再修已證實缺陷；改善內頁內容、索引訊號與日期一致性。已完成可由程式證實的修正、靜態建置與正式發布；需要店家資料或 Google 外部結果的項目保留待確認狀態。

輸入文件：[修改報告](/Users/ouyangtaisen/Downloads/修改報告.md)。目前已依使用者後續「按照修改計劃書修正」要求完成可由程式與部署端執行的項目；店家資料、正式帳號與 Google 外部狀態仍按驗收邊界保留待確認。

逐項驗收對照：[`evidence/modification-report-coverage-2026-09-20.md`](evidence/modification-report-coverage-2026-09-20.md)。

## 現況與差異

| 主題 | 可用證據 | 計畫 |
|---|---|---|
| 首頁已索引 | 報告提供，未重新查 GSC | 保存首頁 canonical 與可索引性基準 |
| sitemap 無法擷取 | 報告提供；正式端點可正常解析目前 17 URLs | 根因未知，A01/A02 證據優先，不能猜是 XML |
| 完整 HTML | 目前 17 個 sitemap 路由均由靜態輸出產生完整 HTML | 保留 SSG，無需另做 SSR 改造 |
| 部署設定 | firebase.json 仍有舊 web Run rewrite；靜態發布使用獨立產物與受控佇列 | live、生成設定、舊設定三方比對，不能誤改 admin SPA |
| canonical | seo-metadata.ts 與 static-release.mjs 已有實作驗證 | 補全頁與負向回歸，不重寫 |
| 文章日期 | document.mjs 優先 contentUpdatedAt；public-snapshot.mjs 已保留此欄位並有回歸測試 | C01 已完成，需整合驗收 |
| 服務日期 | service-schema.ts 每次 payload 設 updatedAt；sitemap 使用該值 | C02 區分實質內容與一般儲存 |
| 列表／分類日期 | document.mjs 以內容日期最新值產生列表與分類 `lastmod`；詳情頁使用自身內容日期 | C03 不依建置／請求時間，無可信日期可省略 |
| 內容 | 五個服務頁及目前公開快照中的四篇文章可索引；3 篇消息與 5 個服務詳情正文仍偏短 | 已建立服務與文章草稿；服務後台可維護 SEO title/description，文章作者／編輯欄位已完成全鏈支援；正式流程、活動、作者與來源內容仍需店家確認 |

## 對原報告的補充判斷

1. privacy/terms 移出 sitemap 是收錄優先順序選擇，不是修复 XML 或無法擷取的根因；移除不代表加 noindex。
2. 薄分類需逐頁評估，文章數不是 Google 規定的索引門檻；先明確列出名單，避免數量變動造成反覆索引切換。
3. metadata/H1 唯一性是本專案品質規則，不是 Google 保證收錄條件；不以正文非空就宣稱解決 soft-404。
4. Googlebot UA 模擬只能證明該 UA 回應一致，不能當作 Google 實際存取證明。
5. Google 處理與收錄為外部結果；根因證據不足就保持「未確認」，不能用重構完成冒充原因已找到。
6. lastmod 應代表實質頁面變更；可包含正文、重要連結、結構化資料變更。不能單看一般 updatedAt，更不能用發布時間。

依據：[Google sitemap 規範](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)、[Search Console sitemap 報告](https://support.google.com/webmasters/answer/7451001)。Google 不保證提交後下載或收錄；priority/changefreq 無需新增。

## 實作順序

A01 → A02 → A03（僅有證據才修）；A01 → B01 → B02；B02 → C01 → C02 → C03 → C04；B01 → D01/D03/E01；D01 確認後 D02；內容確認後 D04；完成項目 → F01 → F02 → F03。

共 17 張主線卡。A/B/C 及 F01/F02 的程式與發布工作已完成；D01 已完成草稿與服務 SEO 欄位及服務詳情欄位支援，D03 的使用者長篇部落格已發布並完成 live 驗證，作者／編輯欄位已打通 Admin → API → snapshot → 靜態 HTML／JSON-LD；3 篇消息與 5 個服務詳情正文仍被稽核列為內容審核警示；後台儲存上架服務時會顯示非阻擋式 SEO 提醒。D02 已補服務頁內鏈、metadata fallback，以及在店家填入確認內容後才呈現的流程／適用情境／注意事項／FAQ 區塊；D02 的正式服務內容、D04、E01 與 F03 的 Google 處理結果仍需店家資料或外部結果。F03 已在新版本發布後於正確 property 受控重新提交一次，Google 顯示「已成功提交 Sitemap」，但列表仍暫時為「無法擷取／0」、詳細頁為「無法讀取 Sitemap」，尚未提供可操作錯誤碼。不要讓外部等待阻塞已確認的 P0 修正。所有共享檔案任務順序執行，避免競爭覆蓋。

## 工時與完成定義

主線估計 38–58 小時工程工作（依逐卡區間加總），不含 Google 等待、店家資訊確認及素材拍攝。根因查不到不無限改碼：A02 到點提交證據缺口與下一個可驗證假說。

程式完成：測試/靜態產物/preview/live 稽核通過。內容完成：店家確認且前台可见。Google 結果完成：GSC 有新讀取時間、成功處理與合理探索數；內頁是否收錄另記，不能捆綁為程式保證。

## 需補資料

電話 `02-2338-1111` 與地址 `108台北市萬華區桂林路2之5號` 已依使用者提供的店家資訊同步；仍需確認每週營業時間、五個服務實際流程與價格條件、2025 活動是否有效、第一人稱文章來源。GSC 若無存取權，需提供帶最後讀取時間與錯誤細節的結果；其他唯讀稽核繼續。

## 延後事項

語意化 URL 遷移獨立放 feature 計畫，P0/P1 不改既有 ID 網址。自有網域與大規模新內容頁也不在本次。當前 validator 要求 10 位 slug，不能只改 slug 或 sitemap 就上線。

## 文件入口

- [Luna 工作清單與執行規則](luna-tasks/README.md)
- [驗收清單](validation-checklist.md)
- [發布與回退清單](release-checklist.md)
- [逐卡完成矩陣](evidence/completion-matrix-2026-09-20.md)
- [服務內容草稿](content/services.md)
- [消息與部落格內容清單](content/articles.md)
- [P2 語意化 URL 遷移](../../feature/seo-semantic-url-migration.md)

交接提示：請先讀本文件與 luna-tasks/README.md，從 A01 開始，僅完成該張卡；不可把整份附件當成一次部署指令。每卡完成後更新狀態及證據，再領下一張。
