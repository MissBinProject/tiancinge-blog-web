# E 串接、驗收與上線任務卡

## E01 官網設定與服務接正式資料
- 參考圖：`02_規劃書/project/visual-baseline/`、`validation-checklist.md`、`release-checklist.md` 與正式資料輸入表。
- 目標：官網 settings/services 改讀 Supabase 並確認首頁/價格/詳情同步。
- 前置任務：B08、C11、D05、D08。允許修改：web data/repository/env。
- 固定契約：無環境變數仍可用 fixture；有資料庫時公開 query 只回傳可見資料。
- 步驟：設定 env → migration/seed → 修改後台 → reload 官網。
- 驗收：一次改價三處一致；交接：附 env key 清單與截圖。

- 交接紀錄：2026-09-14｜Codex｜pnpm test && pnpm test:e2e --workers=1 && pnpm tasks:verify；串接、疊圖及備份證據見 `02_規劃書/project/`、`supabase/backup-restore.md`。 程式與 fixture 驗證通過；正式資料與環境變數待接入。 提交索引見 [commit-map.md](./commit-map.md#e01)。

## E02 消息、文章及搜尋接正式資料
- 參考圖：`02_規劃書/project/visual-baseline/`、`validation-checklist.md`、`release-checklist.md` 與正式資料輸入表。
- 目標：公開列表、詳情、搜尋、sitemap 使用正式 published data。
- 前置任務：B09、C12～C14、D10～D13。允許修改：web data/routes。
- 固定契約：draft 不可由網址、搜尋或 sitemap 取得。
- 步驟：建立資料 → 發布/下架 → 測試公開 query → 檢查 sitemap。
- 驗收：發布狀態及分類一致；交接：附 URL 矩陣。

- 交接紀錄：2026-09-14｜Codex｜pnpm test && pnpm test:e2e --workers=1 && pnpm tasks:verify；串接、疊圖及備份證據見 `02_規劃書/project/`、`supabase/backup-restore.md`。 程式與 fixture 驗證通過；正式資料與環境變數待接入。 提交索引見 [commit-map.md](./commit-map.md#e02)。

## E03 留言提交 API
- 參考圖：`02_規劃書/project/visual-baseline/`、`validation-checklist.md`、`release-checklist.md` 與正式資料輸入表。
- 目標：完成 POST /api/contact 伺服器驗證、限流、防重送與回應。
- 前置任務：B10、C09。允許修改：contact route、API tests。
- 固定契約：必填 name/phone/message，message ≤2000；錯誤 400/429/503。
- 步驟：驗證 trim/length/email → rate limit → insert → response。
- 驗收：成功、空欄位、重送、資料庫錯誤均有明確狀態；交接：附 request/response。

- 交接紀錄：2026-09-14｜Codex｜pnpm test && pnpm test:e2e --workers=1 && pnpm tasks:verify；串接、疊圖及備份證據見 `02_規劃書/project/`、`supabase/backup-restore.md`。 程式與 fixture 驗證通過；正式資料與環境變數待接入。 提交索引見 [commit-map.md](./commit-map.md#e03)。

## E04 聯絡表單串接
- 參考圖：`02_規劃書/project/visual-baseline/`、`validation-checklist.md`、`release-checklist.md` 與正式資料輸入表。
- 目標：訪客提交後後台收到一筆正確留言。
- 前置任務：E03、D14、D15。允許修改：ContactSection、MessagesEditor。
- 固定契約：失敗保留輸入，成功清空並顯示成功訊息。
- 步驟：填表 → submit → 查後台 → 備註/標記處理。
- 驗收：欄位、時間、狀態正確；交接：附端到端截圖。

- 交接紀錄：2026-09-14｜Codex｜pnpm test && pnpm test:e2e --workers=1 && pnpm tasks:verify；串接、疊圖及備份證據見 `02_規劃書/project/`、`supabase/backup-restore.md`。 程式與 fixture 驗證通過；正式資料與環境變數待接入。 提交索引見 [commit-map.md](./commit-map.md#e04)。

## E05 SEO 與分享資訊
- 參考圖：`02_規劃書/project/visual-baseline/`、`validation-checklist.md`、`release-checklist.md` 與正式資料輸入表。
- 目標：完成 metadata、canonical、sitemap、robots 及社群分享圖。
- 前置任務：C15、E02。允許修改：layout、metadata routes、OG image。
- 固定契約：base URL 由 NEXT_PUBLIC_SITE_URL 提供；草稿不得進 sitemap。
- 步驟：設定 metadata → 動態 title/description → 產 sitemap/robots → 驗證 head。
- 驗收：每一公開路由有標題描述且 URL 正確；交接：附 head 檢查。

- 交接紀錄：2026-09-14｜Codex｜pnpm test && pnpm test:e2e --workers=1 && pnpm tasks:verify；串接、疊圖及備份證據見 `02_規劃書/project/`、`supabase/backup-restore.md`。 程式與 fixture 驗證通過；正式資料與環境變數待接入。 提交索引見 [commit-map.md](./commit-map.md#e05)。

## E06 上半頁視覺校正
- 參考圖：`02_規劃書/project/visual-baseline/`、`validation-checklist.md`、`release-checklist.md` 與正式資料輸入表。
- 目標：校正導覽、主視覺、服務、價格與設計稿差異。
- 前置任務：C01～C05、C16。允許修改：web components/CSS/assets。
- 固定契約：基準尺寸 1440、1672；動畫固定狀態；記錄字型差異。
- 步驟：截圖 → 疊圖 → 修正座標/裁切/顏色 → 回歸測試。
- 驗收：每區有 before/after/diff；交接：附差異紀錄。

- 交接紀錄：2026-09-14｜Codex｜pnpm test && pnpm test:e2e --workers=1 && pnpm tasks:verify；串接、疊圖及備份證據見 `02_規劃書/project/`、`supabase/backup-restore.md`。 本機 CSS／截圖流程通過；原始手機稿、字型及照片到位後需完成正式疊圖確認。 提交索引見 [commit-map.md](./commit-map.md#e06)。

## E07 下半頁視覺校正
- 參考圖：`02_規劃書/project/visual-baseline/`、`validation-checklist.md`、`release-checklist.md` 與正式資料輸入表。
- 目標：校正消息、部落格、聯絡、頁尾與設計稿差異。
- 前置任務：C06～C10、C17。允許修改：web components/CSS/assets。
- 固定契約：輪播不自動播放，QR/地圖來源為正式設定。
- 步驟：截圖 → 疊圖 → 修正 → 檢查表單與連結。
- 驗收：各區差異均有紀錄與確認；交接：附截圖。

- 交接紀錄：2026-09-14｜Codex｜pnpm test && pnpm test:e2e --workers=1 && pnpm tasks:verify；串接、疊圖及備份證據見 `02_規劃書/project/`、`supabase/backup-restore.md`。 本機 CSS／截圖流程通過；原始手機稿、字型及照片到位後需完成正式疊圖確認。 提交索引見 [commit-map.md](./commit-map.md#e07)。

## E08 權限與輸入安全測試
- 參考圖：`02_規劃書/project/visual-baseline/`、`validation-checklist.md`、`release-checklist.md` 與正式資料輸入表。
- 目標：驗證越權、草稿存取、惡意正文、非法上傳及限流。
- 前置任務：B06、B07、D12、E03。允許修改：tests、policies、validators。
- 固定契約：RLS 為最終防線；正文不得任意 HTML；上傳 10 MB/MIME 限制。
- 步驟：匿名/非 admin request → XSS fixture → bad file → rate limit。
- 驗收：所有越權及非法輸入被拒；交接：附測試報告。

- 交接紀錄：2026-09-14｜Codex｜pnpm test && pnpm test:e2e --workers=1 && pnpm tasks:verify；串接、疊圖及備份證據見 `02_規劃書/project/`、`supabase/backup-restore.md`。 本機驗證通過；正式 Supabase／Storage 權限或營運演練待執行。 提交索引見 [commit-map.md](./commit-map.md#e08)。

## E09 完整營運流程測試
- 參考圖：`02_規劃書/project/visual-baseline/`、`validation-checklist.md`、`release-checklist.md` 與正式資料輸入表。
- 目標：驗證更新服務、發布文章、替換圖片、處理留言完整流程。
- 前置任務：E01～E04、E08。允許修改：測試 fixture 與修正檔案。
- 固定契約：每流程有可重現步驟與預期結果。
- 步驟：建立/編輯 → 公開驗證 → 回復原值 → 記錄失敗。
- 驗收：Playwright 流程及截圖通過；交接：附流程清單。

- 交接紀錄：2026-09-14｜Codex｜pnpm test && pnpm test:e2e --workers=1 && pnpm tasks:verify；串接、疊圖及備份證據見 `02_規劃書/project/`、`supabase/backup-restore.md`。 本機驗證通過；正式 Supabase／Storage 權限或營運演練待執行。 提交索引見 [commit-map.md](./commit-map.md#e09)。

## E10 正式資料與部署
- 參考圖：`02_規劃書/project/visual-baseline/`、`validation-checklist.md`、`release-checklist.md` 與正式資料輸入表。
- 目標：設定正式網域、Supabase、Vercel、管理員及店家聯絡資料。
- 前置任務：E05、E09。允許修改：Vercel env、Supabase data、部署設定。
- 固定契約：正式資料由店家確認；禁止把測試電話/地址當正式內容。
- 步驟：建立 project → 設 env → deploy web/admin → smoke test。
- 驗收：正式 URL、Auth、Storage、LINE、地圖可用；交接：附部署與回退資訊。

- 交接紀錄：2026-09-14｜Codex｜pnpm test && pnpm test:e2e --workers=1 && pnpm tasks:verify；串接、疊圖及備份證據見 `02_規劃書/project/`、`supabase/backup-restore.md`。 尚未通過：正式網域、Vercel、Supabase、Auth 管理員與店家資料尚未提供。 提交索引見 [commit-map.md](./commit-map.md#e10)。

## E11 備份、回復與交接
- 參考圖：`02_規劃書/project/visual-baseline/`、`validation-checklist.md`、`release-checklist.md` 與正式資料輸入表。
- 目標：驗證資料備份/還原、部署回退及後台操作說明。
- 前置任務：E10。允許修改：release docs、backup scripts。
- 固定契約：保留 migration 版本、備份週期、回復責任人及聯絡方式。
- 步驟：執行備份 → 建暫存資料 → 還原 → 驗證公開/後台 → 撰寫手冊。
- 驗收：回復成功且無資料遺失；交接：附操作手冊、檢查表及已知限制。
- 交接紀錄：2026-09-14｜Codex｜pnpm test && pnpm test:e2e --workers=1 && pnpm tasks:verify；串接、疊圖及備份證據見 `02_規劃書/project/`、`supabase/backup-restore.md`。 本機驗證通過；正式 Supabase／Storage 權限或營運演練待執行。 提交索引見 [commit-map.md](./commit-map.md#e11)。
