# B03｜分類、分頁、搜尋與 404

## 目標
避免重複列表 URL 與不存在內容被索引。

## 範圍
修改 `/news`、`/blog`、`/search` 與 not-found metadata/路由；不要改詳情 slug。

## 步驟
1. 驗證 category/page，只接受存在分類與有效頁碼。
2. 無效值回傳 404；搜尋頁輸出 `noindex,follow`。
3. 後台入口與 admin origin 輸出 `noindex,nofollow`。

## 驗收證據
有效分類與第二頁 200 且 canonical 唯一；`page=0`、超過頁數、未知分類與未知 slug 為 404；搜尋與後台含 noindex。

## 交接
列出測試 URL 與 status/meta 結果。
