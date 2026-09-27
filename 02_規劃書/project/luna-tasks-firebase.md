# Firebase／動態版 Luna 任務卡索引

> 歷史版本：本組 38 張卡片以 Firebase Auth／前端 Firebase SDK 直連為前提，僅供變更追蹤。現行安全實作與待辦請改用 [`../update/data-security/luna-tasks/`](../update/data-security/luna-tasks/README.md)；不要依本組卡片重新設定正式權限。

每卡只修改指定責任範圍，完成後必須回報：修改檔案、命令、結果、截圖／URL、提交 SHA、已知限制。不可自行改動共用契約或把多卡合併成「完成整個後台」。完整卡片已拆成四份，每張卡均包含參考圖、目標、前置任務、可修改範圍、固定資料契約、操作步驟、驗收方式與交接紀錄：

- [A：基礎與安全（FB-A01～FB-A06）](luna-tasks-firebase-A.md)
- [B：資料與 API（FB-B01～FB-B09）](luna-tasks-firebase-B.md)
- [C：管理後台（FB-C01～FB-C13）](luna-tasks-firebase-C.md)
- [D：動態官網與部署（FB-D01～FB-D10）](luna-tasks-firebase-D.md)

合計 38 張獨立任務卡；以下保留一行摘要方便快速排程。

## 基礎與安全

| ID | 任務 | 前置 | 驗收 |
|---|---|---|---|
| FB-A01 | 固定 Firebase 環境契約與 fixture | 無 | env example、型別檢查 |
| FB-A02 | 建立 Firestore collections／indexes | FB-A01 | Emulator 建立成功 |
| FB-A03 | 建立 Auth 管理員白名單 | FB-A02 | 非管理員 403 |
| FB-A04 | 建立 Storage rules 與檔案限制 | FB-A03 | 非法檔案被拒 |
| FB-A05 | 建立 API 錯誤與 token middleware | FB-A03 | 401／403／409 測試通過 |
| FB-A06 | 建立 10 碼代碼產生器 | FB-A02 | collision retry、固定值 |

## 資料與 API

| ID | 任務 | 前置 | 驗收 |
|---|---|---|---|
| FB-B01 | 設定 repository | FB-A05 | 設定往返一致 |
| FB-B02 | 服務 repository | FB-A06 | 排序、價格、上下架 |
| FB-B03 | 分類 repository | FB-A02 | 類型隔離、引用刪除防護 |
| FB-B04 | 文章清單搜尋 repository | FB-B03 | news/blog、狀態、分頁 |
| FB-B05 | 文章保存發布 repository | FB-B04 | 正文及狀態驗證 |
| FB-B06 | 留言 repository | FB-A05 | 狀態、備註、刪除 |
| FB-B07 | 素材 repository | FB-A04 | 上傳、替代文字、引用保護 |
| FB-B08 | Contact API Firestore transaction | FB-A05 | 限流、防重送、失敗保留輸入 |
| FB-B09 | 資料匯入工具 | FB-B01～FB-B07 | 可重跑、筆數報告 |

## 後台

| ID | 任務 | 前置 | 驗收 |
|---|---|---|---|
| FB-C01 | 後台 Firebase Auth adapter | FB-A03 | 登入、登出、重設 |
| FB-C02 | 清單表格與共用分頁 | FB-B02～FB-B07 | 查詢狀態可重現 |
| FB-C03 | 服務清單頁 | FB-C02 | 清單式管理 |
| FB-C04 | 服務編輯頁與圖片選擇 | FB-B07、FB-C03 | 無手填圖片 URL |
| FB-C05 | 消息清單頁 | FB-B04、FB-C02 | 僅 news |
| FB-C06 | 部落格清單頁 | FB-C05 | 僅 blog |
| FB-C07 | Tiptap 基本工具列 | FB-B05 | Word 式格式 |
| FB-C08 | Tiptap 圖片與連結 | FB-B07、FB-C07 | 安全正文再現 |
| FB-C09 | 文章預覽、草稿與發布 | FB-B05、FB-C08 | 草稿不外洩 |
| FB-C10 | 分類清單頁 | FB-B03、FB-C02 | 使用中不可刪 |
| FB-C11 | 素材清單與上傳頁 | FB-B07、FB-C02 | MIME／大小／引用 |
| FB-C12 | 留言清單與詳情頁 | FB-B06、FB-C02 | 處理狀態及備註 |
| FB-C13 | 設定清單與編輯頁 | FB-B01、FB-B07 | 基本、首頁、SEO、政策 |

## 動態官網與部署

| ID | 任務 | 前置 | 驗收 |
|---|---|---|---|
| FB-D01 | Next.js Firebase Admin data adapter | FB-B01 | 無 Supabase import |
| FB-D02 | 動態設定／服務頁 | FB-D01 | 儲存後重新整理即更新 |
| FB-D03 | 動態消息／部落格詳情 | FB-D01、FB-B05 | 草稿 404 |
| FB-D04 | 動態搜尋、metadata、sitemap | FB-D02、FB-D03 | 僅公開資料 |
| FB-D05 | 動態聯絡表單端到端 | FB-B08 | 後台收到留言 |
| FB-D06 | Cloud Run Dockerfile 與健康檢查 | FB-D01～FB-D05 | container 啟動 |
| FB-D07 | Firebase Hosting web rewrite | FB-D06 | HTTPS 動態路由 |
| FB-D08 | 後台 Hosting 部署 | FB-C01～FB-C13 | 登入及 CRUD |
| FB-D09 | Firestore／Storage 越權測試 | FB-D07、FB-D08 | 匿名及非管理員拒絕 |
| FB-D10 | 費用、日誌、備份及回退 | FB-D07～FB-D09 | 演練紀錄完整 |
