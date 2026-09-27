# L20｜詳情精確查詢與請求內共用

## 目標
避免詳情頁讀取整個公開集合後再尋找 slug，降低延遲與資料傳輸。

## 前置
L01。

## 修改範圍
只修改 `apps/web/src/lib/data.ts`、Firebase repository helper 與資料測試；不得改頁面 UI 或導入跨請求快取。

## 固定規格
服務依 slug + visible 查詢；文章依 type + slug + published 查詢；資料庫不存在回 null，資料庫錯誤拋出並由頁面錯誤處理；同一次 request 的 settings／detail 結果可共用，但不得跨 request 保留舊內容。

## 驗收
以 repository mock 確認查詢條件、草稿隔離、隱藏服務隔離、找不到與錯誤分流；SSR 詳情仍含完整正文。

## 交接紀錄
記錄查詢方法、必要索引與 L21、L22 的資料介面。
