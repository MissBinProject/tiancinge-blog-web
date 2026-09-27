# L15｜正文 H2／H3 資料與渲染

## 目標
讓文章正文能明確區分 H2 與 H3，同時維持舊文章格式。

## 前置
無；先讀 `data-contract.md`。

## 修改範圍
只修改 `packages/contracts/src/index.ts`、公開 mapper、`ArticleBody.tsx`、body 驗證與單元測試；不得修改後台編輯器操作。

## 固定規格
heading 接受 `level: 2 | 3`；缺省為 2；其他值拒絕；頁面 H1 仍由文章標題輸出；既有 text runs、對齊與安全 URL 規則保留。

## 驗收
測試舊 heading、新 H2、新 H3、level 1／4／字串、缺少 text 及混合正文；SSR HTML 產生合法 h2／h3，不產生 h1。

## 交接紀錄
記錄序列化格式與 L16、L17 使用的 heading selector。
