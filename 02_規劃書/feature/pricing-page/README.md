# 價目表分頁與首頁推薦項目

## 目標

把店內實體價目表整理成可維護的 `pricing_plans` 資料，提供獨立 `/pricing` 分頁；首頁只顯示後台勾選的推薦項目，完整價目表則顯示所有公開項目。導覽列改為可被搜尋引擎與使用者直接開啟的真實路徑。

## 已完成範圍

- 建立 `PricingPlan` 合約、13 筆店內菜單項目與五個分類。
- 後台新增價目表管理：新增、編輯、刪除、排序、上架、首頁顯示、精選、圖片與替代文字。
- 首頁以 `showOnHome` 與 `homeSortOrder` 控制推薦價目卡片。
- `/pricing` 提供完整分組價目表、分鐘數、備註、價格與預約入口。
- 服務詳情頁顯示關聯價目，並避免輸出過時的服務價格結構化資料。
- 導覽與頁尾連結改為 `/`、`/pricing`、`/news`、`/blog`。
- 靜態快照、Cloud Run 事件監聽與 sitemap 支援 `pricing_plans`。

## 資料規則

`isVisible=false` 的項目不出現在公開頁面與 sitemap；`showOnHome=true` 且可見的項目才出現在首頁。`sortOrder` 控制完整價目表，`homeSortOrder` 控制首頁順序。價格以整數新台幣保存，服務時間以分鐘保存，無法固定時使用 `durationNote`。

## 發布流程

後台儲存 → Firestore `pricing_plans` → sitemap worker 觸發靜態建置 → 產生 `/pricing` HTML 與 sitemap → Firebase Hosting 受控發布。發布前需通過 typecheck、單元測試、sitemap 測試、靜態產物檢查與線上 SEO baseline。

實際發布證據與線上驗收結果記錄於 [release-evidence.md](./release-evidence.md)。
