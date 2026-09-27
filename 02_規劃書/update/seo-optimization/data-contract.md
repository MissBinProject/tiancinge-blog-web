# SEO 資料契約

## 服務

- `seoTitle?: string`：服務詳情 title，缺值使用 `名稱｜品牌`。
- `seoDescription?: string`：服務詳情 description，缺值使用摘要。
- `imageAlt?: string`：服務圖片具體說明，缺值使用服務名稱。
- `updatedAt?: string`：ISO 8601，供 sitemap lastmod。

## 文章

- `seoTitle?: string`、`seoDescription?: string`：已存在欄位，發布前可選填。
- `coverAlt?: string`：封面具體說明，缺值使用文章標題。
- `updatedAt?: string`：ISO 8601，供 sitemap lastmod。
- `status` 必須是 `draft` 或 `published`；只有 `published` 才能出現在公開 repository、搜尋、相關內容及 sitemap。

## 網站設定

- `seoTitle`、`seoDescription`：首頁搜尋摘要，不與視覺區塊標題混用。
- `businessName`、`address`、`phone`、`businessHours`、`logoUrl`：只有確認後才輸出 LocalBusiness。

## URL 規則

- 正式 base URL：`https://tiancinge-web.web.app`。
- 第一頁省略 `page=1`；有效第二頁以上使用自身 canonical。
- 分類頁 canonical 包含 `category`；搜尋頁 `noindex,follow`。
- 所有正文圖片與連結仍通過既有安全 URL 驗證。
