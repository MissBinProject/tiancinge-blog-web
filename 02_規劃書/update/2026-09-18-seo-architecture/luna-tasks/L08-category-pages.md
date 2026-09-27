# L08｜分類頁標題、介紹與 404

## 目標
讓分類篩選頁成為可理解的搜尋入口，而不是只有卡片結果。

## 前置
L03、L06。

## 修改範圍
只修改 `apps/web/src/app/news/page.tsx`、`apps/web/src/app/blog/page.tsx`、分類公開 repository／mapper 與必要 CSS／測試。

## 固定規格
有分類參數時 H1 顯示分類名稱，顯示分類介紹；metadata 使用分類 SEO 欄位並套用 `data-contract.md` fallback；不存在分類或沒有該 type 的公開文章回 404；canonical 保留合法 category，值必須 URL encode。

## 驗收
測試全部、有效分類、空分類、不存在分類、特殊字元分類與非法 page；停用 JS 仍能讀到 H1、介紹及文章連結。

## 交接紀錄
記錄分類查詢行為與 L09 需要放在首頁／頁尾的有效分類來源。
