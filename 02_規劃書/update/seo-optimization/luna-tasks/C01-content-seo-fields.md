# C01｜服務與文章 SEO 欄位

## 目標
讓管理員可維護服務圖片 alt、文章封面 alt、SEO title/description 與 updatedAt。

## 範圍
修改 contracts、Firestore mapper、admin 表單/API schema；保留既有 slug 不可修改規則。

## 步驟
1. 新增 optional `imageAlt`、`coverAlt`、`updatedAt`，設長度上限。
2. 空值以名稱／標題安全 fallback；儲存時更新 updatedAt。
3. 在新增與編輯流程顯示欄位並保留既有資料。

## 驗收證據
後台儲存後公開 HTML alt 與 sitemap lastmod 更新；危險或超長輸入被拒絕。

## 交接
附 schema 測試與一筆可回復的測試資料紀錄。
