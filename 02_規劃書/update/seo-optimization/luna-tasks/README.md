# Luna 工作卡索引

每張卡只負責一個可驗收成果。Luna 執行時需先讀 `../implementation-plan.md`、`../data-contract.md`，完成卡片的驗收證據後再交接下一張。

| 卡片 | 內容 | 依賴 |
| --- | --- | --- |
| A01 | 建立 SEO 基準與爬蟲抽查 | 無 |
| B01 | 正式網址、metadata、canonical | A01 |
| B02 | robots、sitemap、公開狀態隔離 | A01 |
| B03 | 分類／分頁 URL、noindex 與 404 | B01 |
| C01 | 服務與文章 SEO 欄位及後台編輯 | B01 |
| C02 | 素材尺寸與圖片替代文字 | C01 |
| D01 | JSON-LD 與麵包屑 | B01、C01 |
| E01 | 圖片、字型與首屏效能 | B01 |
| E02 | 手機版與 Core Web Vitals | E01 |
| F01 | 店家資料與內容校對 | 無（需店家） |
| G01 | 自動化回歸與 release gate | B01～E02 |
| G02 | Search Console 驗證與提交 | B02、G01 |

建議依序執行 A01 → B01/B02 → B03 → C01/C02 → D01 → E01/E02 → F01 → G01 → G02。每張卡的檔案範圍已限制，避免 Luna 同時修改不相關頁面。
