# Luna SEO 工作卡索引

每張卡只包含一個可驗收結果，執行者不得跨卡重構或自行部署正式環境。所有卡片都要求先讀 `../development-plan.md` 與 `../data-contract.md`。

| 卡片 | 內容 | 依賴 |
| --- | --- | --- |
| L01 | SEO 基線與 HTTP／HTML 檢查腳本 | 無 |
| L02 | 共用 metadata 純函式與測試 | L01 |
| L03 | 列表頁 metadata、canonical、Open Graph | L02 |
| L04 | 詳情頁 metadata 與 404 | L02 |
| L05 | robots、搜尋頁 noindex、sitemap 基礎規則 | L01 |
| L06 | 分類 SEO 資料契約與 API | 無 |
| L07 | 分類後台編輯欄位 | L06 |
| L08 | 分類頁 H1、介紹、canonical 與 404 | L03、L06 |
| L09 | 首頁／頁尾的部落格與分類 HTML 入口 | L08 |
| L10 | 文章來源資料契約與 API | 無 |
| L11 | 文章來源後台編輯 | L10 |
| L12 | 文章實質更新日期判定 | L10 |
| L13 | 編輯團隊設定欄位與 API | 無 |
| L14 | 編輯團隊頁與文章署名 | L13 |
| L15 | 正文 H2／H3 資料與渲染 | 無 |
| L16 | 後台編輯器保留 H2／H3 | L15 |
| L17 | 文章目錄與穩定錨點 | L15 |
| L18 | 來源、更新日期、分類返回與相關資訊呈現 | L08、L10、L12 |
| L19 | Article／BlogPosting 作者與日期 schema | L14、L18 |
| L20 | 詳情精確查詢與請求內共用 | L01 |
| L21 | 列表資料庫篩選、排序與分頁 | L20 |
| L22 | 相關文章查詢與呈現 | L08、L20 |
| L23 | 圖片尺寸、比例、responsive sizes 與載入 | L01 |
| L24 | sitemap、整合驗收與發布證據 | L03～L23 |

## 共用交接要求

每張卡完成後必須記錄：

1. 修改的檔案與未修改的明確邊界。
2. 執行的測試命令與結果。
3. 舊資料相容性與未完成風險。
4. 下一張卡可以直接使用的輸入與依賴。

## 目前實作進度（2026-09-18）

- 已完成程式：L01～L06、L08～L10、L12～L20、L22～L23 的主要範圍；L07 已加入分類 SEO 編輯欄位。圖片 alt 上下文與手機 Lighthouse 三次中位數證據已追加。
- L21 已完成 published/type/category 篩選、`publishedAt desc, documentId desc` 穩定排序、列表欄位 projection 與頁碼轉 Firestore `startAfter` cursor；仍保留既有缺索引 fallback，避免舊環境因索引尚未完成而中斷。正式 API revision 與 source archive 證據見最終發布文件。
- L24 的 staging、Firebase indexes／Hosting 部署與靜態發布已完成；CSP enforce、備份還原、正式回滾演練與 Search Console 非同步收錄狀態仍需外部／維運驗收。
- 最新正式證據見 `../2026-09-20-seo-indexability/evidence/final-release-2026-09-20.md` 與 `evidence/lighthouse-mobile-2026-09-20.json`；不得將 Google 尚未處理的 Search Console 狀態標為成功。
