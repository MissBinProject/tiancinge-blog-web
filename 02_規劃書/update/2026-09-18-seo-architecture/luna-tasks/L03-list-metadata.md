# L03｜列表頁 metadata 與 canonical

## 目標
讓服務、消息、部落格列表及分類／分頁列表都有獨立且一致的搜尋摘要。

## 前置
L02。

## 修改範圍
只修改 `apps/web/src/app/services/page.tsx`、`apps/web/src/app/news/page.tsx`、`apps/web/src/app/blog/page.tsx` 及必要測試。

## 固定規格
title 使用網站設定的列表標題與品牌；description 使用列表副標，分類有值時包含分類；首頁 canonical 省略 `page=1`，第二頁以上使用自身絕對 canonical；Open Graph URL 與 canonical 相同。

## 驗收
用 HTTP 取得無 JS HTML，逐頁檢查 title、description、canonical、OG URL；同一頁不得輸出重複 canonical；非法查詢交由現有 404 契約處理。

## 交接紀錄
列出每個路由的 metadata 範例、測試命令與 L05 的 robots／sitemap 依賴。
