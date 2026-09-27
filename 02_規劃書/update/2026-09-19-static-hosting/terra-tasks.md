# Terra 工作卡

每張卡完成後回報：修改檔案、實際測試指令與輸出、未解風險。不得直接發布 live；只能部署 preview candidate，除非 T16 的切換門檻全部通過。

| 卡號 | 工作 | 前置 | 完成條件 |
|---|---|---|---|
| T01 | 審核公開快照欄位白名單與 fixtures | 無 | 任何私人欄位測試都無法流入 JSON |
| T02 | 補公開快照 schema、版本與雜湊測試 | T01 | 缺設定或失敗讀取時 fail closed |
| T03 | 把文章／服務建立與修改寫入發布狀態 | T02 | 後台可區分已儲存、等待、建置、失敗、已上線 |
| T04 | 建立私有 Cloud Build source archive 發布入口 | T02 | 事件可從鎖定 generation 取得快照並完成 preview build |
| T05 | 設定 Cloud Build、worker IAM 與 substitution | T04 | 不授權帳號不能讀 snapshot 或發佈 Hosting |
| T06 | 把 worker 設為 static mode，驗證 60 秒合併 | T04、T05 | 連續三次內容變更只啟動一個 build |
| T07 | 實作 build status 輪詢 API 與後台顯示 | T03、T06 | 顯示 Cloud Build／發布失敗原因摘要 |
| T08 | 為舊 `?page`、`?category` 建相容導向 | T04 | 舊連結到達等價實體路徑，無重複 canonical |
| T09 | 以真實快照驗證所有服務、文章、分類、分頁 | T04 | sitemap 每個 URL 都有 HTML、canonical、主要內容 |
| T10 | 建立靜態 Hosting preview 的效能與手機版基線 | T09 | LCP、JS、圖片與手機版回歸紀錄完成 |
| T11 | 實作緊急下架資料模型與優先佇列 | T03、T06 | 下架請求有版本、操作者、影響範圍與重試狀態 |
| T12 | 實作產物撤除：詳情、列表、首頁、搜尋與 sitemap | T11 | 任一撤除文章不再被任一公開產物引用 |
| T13 | 實作安全回滾檢查 | T11 | 回滾不會重新公開已緊急下架內容 |
| T14 | 演練建置失敗、重試、重複事件、競態發布 | T06、T07 | live 不被半成品或舊序號覆蓋 |
| T15 | 停用舊 sitemap 獨立發布排程與修復入口 | T09、T14 | static mode 下不存在事後 sitemap 覆寫 |
| T16 | staging→live 切換與 Search Console 驗收 | T10、T12–T15 | 首頁／詳情 HTML、sitemap、robots、API、404 全數通過 |
| T17 | 建立維運手冊、預算告警與月度發布稽核 | T16 | 接手者可重試、下架、回滾與查詢版本 |

建議順序：`T01 → T02 → T03/T04 → T05 → T06/T07/T08 → T09/T10 → T11/T12/T13 → T14/T15 → T16 → T17`。
