# SEO 實作規劃

## 技術順序

1. 固定正式網址來源，修正 robots 與 sitemap。
2. 抽出 metadata、canonical、分頁與分類 URL 規則。
3. 加入 noindex、草稿隔離、404 與 sitemap lastmod。
4. 擴充服務、文章、素材的 SEO 欄位及後台編輯。
5. 加入 LocalBusiness、Service、Article／BlogPosting、BreadcrumbList JSON-LD。
6. 最佳化圖片、字型、首屏及手機排版。
7. 以靜態 HTML、HTTP、Playwright、結構化資料與 Search Console 完成驗收。

## 固定介面

- 公開內容 repository 只回傳已發布文章及可見服務。
- metadata 以內容自訂 SEO 欄位優先，缺值時使用具體標題／摘要。
- `lastmod` 只使用資料庫可信的 `updatedAt`，沒有可信值就省略。
- 文章正文仍使用受限結構化格式，不接受任意 HTML。
- 正式公開頁採 Next.js static export；Firestore 公開快照變更後由 Cloud Build 產生完整 HTML、robots 與 sitemap，再經 Hosting candidate／發布佇列上線。Cloud Run 不承接公開頁 catch-all 請求，只提供聯絡表單、管理 API 與發布協調。
- 後台儲存後由事件觸發下一次靜態建置；在發布完成前顯示「已儲存，尚未上線」，發布完成後重新整理官網即可看到更新。

## 不在本輪

- 不保證排名、收錄或 Google 特殊搜尋版位。
- 不自動生成未核實的療效、評論、評分、作者或營業資訊。
- 不更換既有十位亂碼網址，不新增付費 SEO 平台。
