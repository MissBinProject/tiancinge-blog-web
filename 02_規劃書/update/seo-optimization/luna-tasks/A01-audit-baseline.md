# A01｜建立 SEO 基準

## 目標
記錄正式站與本機的 HTTP、HTML、索引與效能基準，讓後續修改可以比較。

## 參考
`../audit-report.md`、`../validation-checklist.md`。

## 範圍
只新增稽核腳本或 `evidence/` 結果，不修改產品程式與資料。

## 步驟
1. 抽查首頁、列表、三類詳情、政策、搜尋、robots、sitemap 與不存在 URL。
2. 確認 status、title、description、canonical、HTML 可見文字、robots meta。
3. 以 Lighthouse 或 PageSpeed 記錄 mobile/desktop LCP、INP、CLS 與主要圖片大小。

## 驗收證據
`evidence/` 內有帶日期的 JSON/Markdown，列出 URL、HTTP status、canonical、SSR 關鍵字與效能數值；不存在頁為 404。

## 交接
回報三個最高風險與重現指令，供 B01/B02 使用。
