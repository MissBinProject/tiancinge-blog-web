# L07｜分類後台 SEO 編輯欄位

## 目標
讓管理員能編輯分類介紹、SEO title 與 SEO description。

## 前置
L06。

## 修改範圍
只修改 `apps/admin/src/main.tsx` 分類管理區、`apps/admin/src/repositories.ts` 相關 adapter、樣式與管理員測試；不得修改文章內容編輯器。

## 固定規格
欄位可留白；即時顯示長度錯誤；儲存沿用既有登入、版本衝突與 audit；重整頁面後值仍存在；刪除分類及「使用中的分類不可刪除」規則維持。

## 驗收
登入後新增／編輯／重整分類，確認三欄一致；未登入不能寫入；錯誤輸入不送出；舊分類只顯示空值 fallback。

## 交接紀錄
記錄 UI 欄位與 adapter payload，提供 L08 的顯示條件。
