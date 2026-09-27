# L09｜首頁與頁尾的文章 HTML 入口

## 目標
補足從首頁到部落格列表及分類頁的普通 HTML 連結，改善爬蟲與使用者導覽。

## 前置
L08。

## 修改範圍
只修改 `apps/web/src/components/ArticlesSection.tsx`、`apps/web/src/components/Footer.tsx` 及相關測試／CSS。

## 固定規格
保留首頁錨點；部落格摘要區提供 `/blog`；只對實際存在的分類提供 `/blog?category=`；頁尾提供部落格列表與最新消息列表入口；不得用 `onClick` 或僅 JavaScript 產生唯一入口。

## 驗收
以 SSR HTML 檢查連結 href；手機版無水平溢出；分類為空時不輸出壞連結；既有首頁區塊版型不變。

## 交接紀錄
列出新增 href 與 L24 需檢查的內部連結數量。
