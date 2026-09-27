# L06｜分類 SEO 資料契約與 API

## 目標
為消息與部落格分類增加可選介紹及 SEO 欄位，且不破壞舊分類資料。

## 前置
無；先讀 `data-contract.md`。

## 修改範圍
只修改 `packages/contracts/src/index.ts`、公開／管理分類 mapper、`apps/web/src/features/admin-content/categories/category-schema.ts` 與分類 API 測試。

## 固定規格
新增 `description` 2000 字、`seoTitle` 160 字、`seoDescription` 300 字；欄位選填，舊文件缺值映射為空字串；HTML、script scheme、任意 URL 不接受；既有 type `news|blog`、權限、版本與 audit 不變。

## 驗收
測試舊資料、新欄位、超長、空值、錯誤 type、script 字串；管理 API 未登入仍拒絕；公開 mapper 不回退示意資料。

## 交接紀錄
記錄欄位型別與 API payload，提供 L07、L08 的相容輸入。
