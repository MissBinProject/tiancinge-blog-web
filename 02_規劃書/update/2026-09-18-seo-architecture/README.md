# SEO 架構優化交付包

執行日期：2026-09-18。

本交付包把天心閣官網的 SEO 架構優化拆成可獨立執行的 Luna 工作卡。目標是提升養生文章的自然搜尋可見性，同時保留現有 `tiancinge-web.web.app` 網域、文章網址、首頁錨點導覽與視覺設計。

## 目前結論

- 現有 Next.js + Cloud Run 架構已能以伺服器 HTML 回傳首頁、列表與詳情內容，不需要改成另一套 SSR 框架。
- 已具備基本 metadata、canonical、robots、sitemap、JSON-LD、圖片 alt 與 WebP；本輪補強會集中在內容關聯、分類品質、作者可信度、查詢效率與驗收自動化。
- 本輪以技術架構為範圍，不替店家捏造文章、療效、作者資格、營業資料或引用來源。

## 交付內容

- `optimization-report.md`：現況證據、已知問題、風險與優先度。
- `development-plan.md`：架構方案、介面、資料流、依賴與發布策略。
- `development-hours.md`：L01～L24 的人時估算與估算邊界。
- `data-contract.md`：新增欄位、驗證規則與舊資料相容方式。
- `evidence/2026-09-18-baseline.md`：開發前公開端點與 Search Console 基線證據。
- `luna-tasks/`：L01～L24，每卡只完成一個可驗收結果。
- `validation-checklist.md`、`release-checklist.md`：整合驗收與上線門檻。

## 固定決策

- 保留 `https://tiancinge-web.web.app` 作為正式 origin。
- 保留 `/blog/[slug]`、`/news/[slug]`、`/services/[slug]`，不批次改 slug。
- 保留首頁錨點導覽；在首頁摘要與頁尾補普通 HTML 入口。
- 保留動態 SSR；不導入只靠 JavaScript 才能取得內容的無限捲動。
- 文章作者顯示「天心閣養生會館編輯團隊」，不虛構具名作者。
- 文章內容、正式店家資料與 Search Console 收錄結果分開驗收；技術通過不代表排名或收錄保證。

## Luna 執行順序

`L01 → L02 → L03/L04/L05 → L06 → L07/L08/L09 → L10 → L11/L12 → L13 → L14 → L15 → L16/L17/L18 → L19 → L20 → L21 → L22 → L23 → L24`

Luna 每完成一張卡，必須在該卡的交接紀錄填寫實際修改檔案、測試輸出、未完成風險與下一張卡；不得自行部署正式環境。
