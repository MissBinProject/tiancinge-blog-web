# L02｜建立共用 metadata 產生器

## 目標
將 title、description、canonical、Open Graph 的 fallback 與正式 origin 集中成可測試的純函式。

## 前置
L01 完成基線。

## 修改範圍
只新增或修改 `apps/web/src/lib/seo-metadata.ts`、其單元測試與必要的 `apps/web/src/lib/site-url.ts`；不得改頁面 JSX。

## 固定規格
輸入頁面類型、標題、描述、路徑、圖片、圖片替代文字與網站名稱；輸出絕對 HTTPS canonical、Open Graph URL、locale `zh_TW` 及安全 fallback。正式環境永遠使用 `https://tiancinge-web.web.app/`，不採用請求 Host。

## 驗收
測試空值、超長值、相對路徑、查詢參數、外部圖片及 localhost 環境；`pnpm --filter @tian-xin-ge/web test` 與 typecheck 通過。

## 交接紀錄
記錄 API 型別、測試結果及 L03、L04 可直接呼叫的函式名稱。
