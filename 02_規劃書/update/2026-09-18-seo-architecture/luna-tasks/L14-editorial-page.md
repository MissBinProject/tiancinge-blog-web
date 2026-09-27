# L14｜編輯團隊頁與文章署名

## 目標
建立可驗證的團隊編輯說明，讓文章有一致、真實的作者呈現。

## 前置
L13。

## 修改範圍
新增 `apps/web/src/app/editorial/page.tsx`，並修改文章詳情共用呈現、robots／sitemap 測試；不得建立具名作者或資格。

## 固定規格
作者顯示設定的團隊名稱，缺值為「天心閣養生會館編輯團隊」；簡介與編輯原則完整填寫才允許 `/editorial` 索引並列入 sitemap，否則 `noindex,follow`；頁面有唯一 H1、metadata、canonical。

## 驗收
完整與不完整設定各測一次；文章作者與團隊頁文字一致；停用 JS 可讀取；不存在設定不回退示意人員資料。

## 交接紀錄
記錄索引條件與 L19 的 author／publisher 輸出契約。
