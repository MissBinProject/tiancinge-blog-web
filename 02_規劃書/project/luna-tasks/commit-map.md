# Luna 任務提交索引

更新日期：2026-09-15。每張卡的交接欄已指向本表；同一個 SHA 代表該功能在同一個可回退提交中交付。提交為群組提交時，依檔案與測試證據判定卡片範圍，不虛構不存在的逐卡 SHA。

正式資料、權限、部署及素材尚未到位的卡片仍保留「待正式驗證」狀態；本表的提交索引不代表已完成正式上線。

| 任務 | 相關提交 | 交接狀態 |
|---|---|---|
| <a id="a01"></a>A01 | 3759e6e, faa5396 | 本機 fixture 驗收通過。 |
| <a id="a02"></a>A02 | 3759e6e | 本機 fixture 驗收通過。 |
| <a id="a03"></a>A03 | 3759e6e, 551dc1d, c38a3a2 | 本機 fixture 驗收通過。 |
| <a id="a04"></a>A04 | 3759e6e, 4c5016 | 本機 fixture 驗收通過。 |
| <a id="a05"></a>A05 | 3759e6e, 5a352f7 | 本機 fixture 驗收通過；390px 單欄配置與 768px 平板欄數由 CSS／Playwright 固定。 |
| <a id="a06"></a>A06 | 3759e6e | 本機 fixture 驗收通過。 |
| <a id="a07"></a>A07 | 3759e6e, 1de1a07 | 本機 fixture 驗收通過。 |
| <a id="b01"></a>B01 | 3759e6e | 本機 fixture 驗收通過。 |
| <a id="b02"></a>B02 | 3759e6e | 本機 fixture 驗收通過。 |
| <a id="b03"></a>B03 | 3759e6e, 665280c, 674eec3 | 本機 fixture／暫存 PostgreSQL 驗收通過；單一網站設定列 trigger 具交易級競態保護，服務圖示值由資料庫 constraint 固定。 |
| <a id="b04"></a>B04 | 3759e6e, 41a2431 | 本機 fixture／暫存 PostgreSQL 驗收通過；文章 trigger 強制文章類型與分類類型一致。 |
| <a id="b05"></a>B05 | 3759e6e, 665280c | 本機 fixture／暫存 PostgreSQL 驗收通過；單一管理員 trigger 具交易級競態保護。 |
| <a id="b06"></a>B06 | 3759e6e, 1de1a07, 90fcd1f | 本機驗證通過；素材引用 guard 已限制函式執行角色，正式 Supabase／Storage 權限或營運演練待執行。 |
| <a id="b07"></a>B07 | 3759e6e, 1de1a07, 90fcd1f | 本機驗證通過；素材引用 guard 已限制函式執行角色，正式 Supabase／Storage 權限或營運演練待執行。 |
| <a id="b08"></a>B08 | 3759e6e, ef9283b | 程式與 fixture 驗證通過；正式資料與環境變數待接入。 |
| <a id="b09"></a>B09 | 3759e6e, ef9283b, 41a2431 | 程式與 fixture／暫存 PostgreSQL 驗證通過；文章與分類類型關聯由資料庫再次固定，正式資料與環境變數待接入。 |
| <a id="b10"></a>B10 | 3759e6e, 89fd05c | 程式與 fixture 驗證通過；正式資料與環境變數待接入。 |
| <a id="c01"></a>C01 | 3759e6e, 4c5016, cfddded | 本機 fixture 驗收通過。 |
| <a id="c02"></a>C02 | 3759e6e, 705d6dc, eb761a3 | 本機 fixture 驗收通過；跳至主要內容錨點指向各頁 `main#main-content`，並可接收鍵盤焦點。 |
| <a id="c03"></a>C03 | 3759e6e, 4c5016, f696054 | 本機 fixture 驗收通過。 |
| <a id="c04"></a>C04 | 3759e6e, 551dc1d | 本機 fixture 驗收通過。 |
| <a id="c05"></a>C05 | 3759e6e, 751ce69 | 本機 fixture 驗收通過。 |
| <a id="c06"></a>C06 | 3759e6e, 21d8668 | 本機 fixture 驗收通過；消息輪播控制群組補上可及性語意。 |
| <a id="c07"></a>C07 | 3759e6e, d2258b4, c95472f, 5a56a70, c9001d4 | 本機 fixture 驗收通過；首頁分類入口完整跟隨所有已發布文章分類。 |
| <a id="c08"></a>C08 | 3759e6e, 5770785, c48acd7 | 本機 fixture 驗收通過。 |
| <a id="c09"></a>C09 | 3759e6e, 89fd05c, 21d8668 | 本機 fixture 驗收通過；聯絡表單欄位補上 aria-label 與自動填寫屬性。 |
| <a id="c10"></a>C10 | 3759e6e | 本機 fixture 驗收通過。 |
| <a id="c11"></a>C11 | 3759e6e, 751ce69, 61c8616 | 本機 fixture 驗收通過；服務詳情保留多行介紹與 LINE 預約入口。 |
| <a id="c12"></a>C12 | 3759e6e, d2258b4 | 本機 fixture 驗收通過。 |
| <a id="c13"></a>C13 | 3759e6e, f696054 | 本機 fixture 驗收通過。 |
| <a id="c14"></a>C14 | 3759e6e | 本機 fixture 驗收通過。 |
| <a id="c15"></a>C15 | 3759e6e, 6329f57, 5ccca0f, ee1389e | 本機 fixture 驗收通過；政策頁具動態標題、描述與分享資訊，404 也保留固定導覽與頁尾，正式資料連線錯誤不會回退測試內容。 |
| <a id="c16"></a>C16 | 3759e6e, 690db45, 4c5016, b5e7471, 5a352f7, fe75ebc | 本機 CSS／截圖流程通過；390px 服務與價格卡單欄、768px 首頁維持三欄配置且內頁不溢出，長服務摘要可折行，原始手機稿、字型及照片到位後需完成正式疊圖確認。 |
| <a id="c17"></a>C17 | 3759e6e, 690db45, d2258b4, 5a352f7, fe75ebc | 本機 CSS／流程通過；390px 部落格與特色列單欄、768px 內頁列表兩欄，消息輪播每頁顯示一張，原始手機稿、字型及照片到位後需完成正式疊圖確認。 |
| <a id="c18"></a>C18 | 3759e6e, 690db45, 5a352f7, fe75ebc | 本機 CSS／流程通過；390px 服務／消息／部落格列表單欄、768px 列表兩欄且服務詳情上下排列，手機內頁無溢出，原始手機稿、字型及照片到位後需完成正式疊圖確認。 |
| <a id="d01"></a>D01 | 3759e6e, 665280c | 本機 fixture 驗收通過；Supabase 單一管理員關聯的 trigger 具交易級競態保護，正式 Auth 待設定。 |
| <a id="d02"></a>D02 | 3759e6e, 7267c23, 5c142b6 | 本機 fixture 驗收通過；收合側欄保留按鈕名稱、aria-expanded 與目前頁面 aria-current，後台正式網址組合會移除尾斜線。 |
| <a id="d03"></a>D03 | 3759e6e, 1de1a07, e9f4eef | 本機 fixture 驗收通過；Dashboard 統一提供素材資料，素材編輯器不再重複載入舊快照。 |
| <a id="d04"></a>D04 | 3759e6e, e9f4eef | 本機 fixture 驗收通過；共用圖片選擇器改由父層傳入已同步素材。 |
| <a id="d05"></a>D05 | 3759e6e, f696054, c38a3a2, 145ee6b | 本機 fixture 驗收通過。 |
| <a id="d06"></a>D06 | 3759e6e | 本機 fixture 驗收通過。 |
| <a id="d07"></a>D07 | 3759e6e, b0a0a40 | 本機 fixture 驗收通過。 |
| <a id="d08"></a>D08 | 3759e6e | 本機 fixture 驗收通過。 |
| <a id="d09"></a>D09 | 3759e6e, e255377, bae4651 | 本機 fixture 驗收通過。 |
| <a id="d10"></a>D10 | 3759e6e, b0a0a40, 6df61dc, e9f4eef | 本機 fixture 驗收通過；文章列表使用 Dashboard 已同步資料，避免重複 repository 載入。 |
| <a id="d11"></a>D11 | 3759e6e, bae4651, e9f4eef | 本機 fixture 驗收通過；文章基本資料表單與素材選擇器共用父層資料。 |
| <a id="d12"></a>D12 | 3759e6e, e9f4eef, 5154dbf, 2f61eaf | 本機 fixture 驗收通過；正文圖片選擇器使用同一份已同步素材，發布前會驗證正文存在。 |
| <a id="d13"></a>D13 | 3759e6e, b0a0a40, 5154dbf, 2f61eaf, 1e65ad7 | 本機 fixture 驗收通過；缺少正文的文章只能保存為草稿，發布操作會明確回報原因並維持草稿狀態，已發布文章可下架回草稿。 |
| <a id="d14"></a>D14 | 3759e6e | 本機 fixture 驗收通過。 |
| <a id="d15"></a>D15 | 3759e6e | 本機 fixture 驗收通過。 |
| <a id="d16"></a>D16 | 3759e6e | 本機 fixture 驗收通過。 |
| <a id="d17"></a>D17 | 3759e6e, 15123a6, c709884, 7267c23, e9f4eef | 本機 fixture 驗收通過；Supabase 正式資料初次載入期間不掛載內容編輯區，且所有編輯器共用 Dashboard 載入結果，收合側欄提供一致的儲存／目前頁面語意。 |
| <a id="e01"></a>E01 | 3759e6e, f696054 | 程式與 fixture 驗證通過；正式資料與環境變數待接入。 |
| <a id="e02"></a>E02 | 3759e6e, ef9283b, 5154dbf, 2f61eaf | 程式與 fixture 驗證通過；空正文文章不會被發布，正式資料與環境變數待接入。 |
| <a id="e03"></a>E03 | 3759e6e, 89fd05c, c360aed, 172152c | 程式與 fixture 驗證通過；正式資料與環境變數待接入。 |
| <a id="e04"></a>E04 | 3759e6e, c48acd7 | 程式與 fixture 驗證通過；正式資料與環境變數待接入。 |
| <a id="e05"></a>E05 | 3759e6e, f696054, 6329f57 | 程式與 fixture 驗證通過；政策頁也輸出動態 metadata，正式資料與環境變數待接入。 |
| <a id="e06"></a>E06 | 690db45, 4c5016, 551dc1d, ded03d4, 2ee56d8 | 本機 CSS／截圖流程通過；基準腳本等待圖片／地圖 iframe 並確認連續兩次 hash 一致，原始手機稿、字型及照片到位後需完成正式疊圖確認。 |
| <a id="e07"></a>E07 | 690db45, d2258b4, 5770785, ded03d4, 2ee56d8 | 本機 CSS／截圖流程通過；基準腳本等待圖片／地圖 iframe 並確認連續兩次 hash 一致，原始手機稿、字型及照片到位後需完成正式疊圖確認。 |
| <a id="e08"></a>E08 | 1de1a07, 89fd05c, c360aed, 172152c, 665280c, 674eec3, 41a2431, d07c55d | 本機驗證通過；`db:verify` 新增非管理員角色的讀寫拒絕案例，並保留 singleton trigger、服務圖示 constraint 與文章／分類類型 guard；正式 Supabase／Storage 權限或營運演練待執行。 |
| <a id="e09"></a>E09 | b0a0a40, 717bf8c, c6f85f3 | 本機驗證通過；正式 Supabase／Storage 權限或營運演練待執行。 |
| <a id="e10"></a>E10 | — | 尚未通過：正式網域、Vercel、Supabase、Auth 管理員與店家資料尚未提供。 |
| <a id="e11"></a>E11 | 717bf8c, b63955c | 本機驗證通過；正式 Supabase／Storage 權限或營運演練待執行。 |

## 共同驗證命令

- `pnpm tasks:verify`：確認 63 張卡均有必要欄位。
- `pnpm typecheck`、`pnpm build`：官網與後台型別及建置。
- `pnpm test`：Vitest 13 個測試。
- `pnpm test:e2e --workers=1`：Playwright 24 個公開／後台流程，新增後台主要模組 390px 無水平溢出驗收。
- `pnpm db:verify`：暫存 PostgreSQL migration、RLS、Storage 與引用保護。
- `pnpm db:backup:verify`：本機備份、checksum、異動與回復演練。
