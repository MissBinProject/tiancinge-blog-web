# L01｜建立 SEO 基線與檢查腳本

## 目標
建立可重複執行的公開 SEO 基線，讓後續工作卡使用同一套證據比較。

## 前置
無。

## 修改範圍
只新增 `scripts/check-seo-baseline.mjs` 與根目錄 `package.json` 的 `seo:baseline` script；不得修改網站行為或正式資料。

## 固定規格
檢查 `/`、`/services`、`/news`、`/blog`、一個服務詳情、消息詳情、部落格詳情、`/robots.txt`、`/sitemap.xml` 及一個不存在 URL。輸出 HTTP status、title、description、canonical、H1 數量、正文關鍵文字、JSON-LD 類型與圖片 alt 缺漏。

## 驗收
執行 `pnpm seo:baseline` 可在正式 URL 或 `SEO_BASE_URL` 上完成；錯誤狀態以非零結束碼回報，輸出 JSON 與人類可讀摘要；不洩漏 cookie、token 或管理資料。

## 交接紀錄
完成後記錄執行日期、修改檔案、基線輸出位置、測試結果與下一張 L02 的輸入。
