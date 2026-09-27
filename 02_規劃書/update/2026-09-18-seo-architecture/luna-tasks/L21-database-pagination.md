# L21｜列表資料庫篩選、排序與分頁

## 目標
把公開文章列表的篩選與分頁移到資料庫，避免讀取全部正文。

## 前置
L20。

## 修改範圍
只修改公開文章 repository、news／blog page 呼叫點、`ArticleList` props、必要 Firestore index 檔案與測試。

## 固定規格
每頁 8 篇；先篩選 type、published、category，再依 `publishedAt desc, documentId desc` 穩定排序；page 1 不需 offset，後續使用既定 cursor／頁碼契約；頁面只讀列表所需欄位，不讀 body。

## 驗收
測試 0、1、8、9 篇、分類、非法頁碼、下架與同日期排序；確認 query 有 limit／篩選，沒有全集合 body 讀取；舊 URL 行為相容。

## 交接紀錄
- `apps/web/src/lib/data.ts` 的 `loadArticlePage` 已使用 `where(status/type/category)`、`orderBy('publishedAt', 'desc')`、`orderBy('__name__', 'desc')` 與 `startAfter(lastDocument)`；每次只讀 `ARTICLE_LIST_FIELDS`，不讀正文。
- 正式資料庫查詢缺少必要索引時仍走受限欄位的排序 fallback；不得把 fallback 誤當成正式大資料量路徑，索引部署仍應維持。
- Web 46 tests、Web typecheck 通過；Cloud Run API revision `tiancinge-web-cursor20260920` 已切 100% 流量，worker source archive 已同步更新。L24 的靜態 Hosting 發布仍由 worker 控制。
