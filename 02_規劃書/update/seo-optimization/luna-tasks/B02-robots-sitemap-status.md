# B02｜robots、sitemap 與公開狀態

## 目標
robots 指向正式 sitemap；sitemap 只列出 HTTP 200 的公開服務與文章，並在可信時提供 lastmod。

## 參考與範圍
參考 `../audit-report.md`、`../release-checklist.md`；修改 robots、sitemap、公開 repository 與必要的資料修正腳本。

## 步驟
1. `robots.txt` 以正式 origin 輸出 `Sitemap: https://.../sitemap.xml`。
2. `loadArticles` 只回傳 `published`，`loadServices` 只回傳可見項目。
3. 檢查草稿、隱藏服務與不存在 slug 不會進 sitemap。
4. 修改前備份資料，對測試草稿使用明確 id/slug guard。

## 驗收證據
robots/sitemap HTTP 200；XML 每個 URL 可取得 200；抽查草稿與隱藏服務不在 XML。

## 交接
提供 sitemap URL 清單、資料備份位置與變更筆數。
