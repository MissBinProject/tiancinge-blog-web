# L05｜robots、搜尋頁 noindex 與 sitemap 基礎規則

## 目標
讓 Google 可以讀取 sitemap 與搜尋頁，但不把站內搜尋或管理 API 納入索引。

## 前置
L01；L03、L04 可並行但整合前需完成。

## 修改範圍
只修改 `apps/web/src/app/robots.ts`、`apps/web/src/app/search/page.tsx`、`apps/web/src/app/sitemap.ts` 及測試。

## 固定規格
robots 允許 `/search`，禁止 `/api/`；搜尋頁使用 `noindex,follow`；sitemap 僅列公開服務、公開消息、公開部落格與固定政策頁，禁止 localhost、追蹤參數、草稿與搜尋頁。

## 驗收
`curl` 檢查 robots／sitemap 為 200；XML 可解析且網址無重複；搜尋頁 response header／HTML 有 noindex；草稿與隱藏服務不出現。

## 交接紀錄
記錄 sitemap URL 清單與 L24 需要保留的驗收命令。
