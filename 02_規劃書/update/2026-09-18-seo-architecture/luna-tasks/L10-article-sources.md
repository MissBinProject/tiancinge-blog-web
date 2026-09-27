# L10｜文章來源資料契約與 API

## 目標
為文章建立可驗證的引用來源資料，支援讀者理解內容依據。

## 前置
無；先讀 `data-contract.md`。

## 修改範圍
只修改 `packages/contracts/src/index.ts`、文章公開／管理 mapper、`apps/web/src/features/admin-content/articles/article-schema.ts` 與 API 測試。

## 固定規格
新增 `sources?: {title:string;url:string}[]`，最多 10 筆；title 1～160 字；URL 只接受 HTTPS、最多 2048 字；舊資料映射為空陣列；禁止 script scheme、空白與明碼秘密。

## 驗收
測試新增、讀取、刪除、超量、超長、HTTP、javascript、空 title；來源錯誤不得儲存；既有文章 body、status、version 與 audit 不變。

## 交接紀錄
記錄來源 schema 與 L11、L18、L19 可使用的 mapper 輸出。
