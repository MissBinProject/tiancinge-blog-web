# D01｜JSON-LD 與麵包屑

## 目標
以可見且已核實內容輸出 LocalBusiness、Service、Article/BlogPosting、BreadcrumbList（若頁面有麵包屑）。

## 範圍
修改 `StructuredData`、schema helper、首頁與詳情頁；不新增評論、評分、療效或虛構作者。

## 步驟
1. 對 JSON-LD 做 `<` escaping，避免內容終止 script。
2. schema 的 name、description、url、image、日期與價格必須與畫面一致。
3. 以 Rich Results Test 或 JSON parser 驗證。

## 驗收證據
SSR HTML 含可解析 JSON-LD；每個 URL 與 schema type 對照正確，無 placeholder 評論與 rating。

## 交接
附 JSON-LD 擷取結果與驗證工具輸出。
