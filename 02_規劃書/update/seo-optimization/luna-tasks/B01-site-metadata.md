# B01｜正式網址與頁面 metadata

## 目標
讓每個可索引頁面依內容輸出唯一 title、description、Open Graph 與絕對 HTTPS canonical。

## 參考與範圍
參考 `../data-contract.md`；修改 `apps/web/src/lib/site-url.ts`、各公開 `page.tsx` 與共用 layout。

## 步驟
1. 所有正式 URL 只由 `NEXT_PUBLIC_SITE_URL` 或正式安全 fallback 產生。
2. 詳情頁優先使用內容 SEO 欄位，缺值使用具體標題／摘要。
3. 列表的分類與 page query 產生對應 metadata；第一頁省略 `page=1`。

## 驗收證據
curl 每個公開 URL，確認 title、description、canonical 都是絕對 HTTPS 且互不誤用；`localhost` 不得出現在 production HTML。

## 交接
附 URL → metadata 對照表與測試命令。
