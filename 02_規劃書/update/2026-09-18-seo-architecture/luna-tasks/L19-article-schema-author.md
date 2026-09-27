# L19｜Article／BlogPosting 作者與日期 schema

## 目標
補齊文章結構化資料的作者、publisher、日期與可見內容一致性。

## 前置
L14、L18。

## 修改範圍
只修改 `apps/web/src/lib/seo-schema.ts`、schema 測試與文章詳情的 schema 呼叫；不得加入未核實的評分、FAQ、醫療資格或評論。

## 固定規格
部落格使用 `BlogPosting`，消息使用 `Article`；author 為 Organization，名稱與頁面署名一致；publisher 使用 LocalBusiness／Organization 的既有 `@id`；datePublished 使用發布日，dateModified 使用 contentUpdatedAt，缺值回退發布日；image、url、mainEntityOfPage 為絕對 URL。

## 驗收
用 JSON.parse 與 schema 測試檢查所有必備欄位；與 SSR 可見標題、作者、日期逐項比對；內容缺圖或缺日期時不輸出錯誤欄位。

## 交接紀錄
記錄 schema JSON 範例與 L24 結構化資料驗收命令。
