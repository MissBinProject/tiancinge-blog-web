# D 後台逐項功能任務卡

## D01 登入、登出與重設密碼
- 參考圖：無原始後台設計稿；依 `02_規劃書/project/ui-templates.md` 與既有官網設計變數建立樣板。
- 目標：單一管理員完成 Supabase Auth 登入、登出及重設密碼入口。
- 前置任務：B06。允許修改：admin auth components/repository。
- 固定契約：關閉公開註冊；未登入不能看到管理畫面。
- 步驟：登入表單 → session listener → logout → reset flow。
- 驗收：錯誤、逾時及登出狀態清楚；交接：附流程截圖。

- 交接紀錄：2026-09-14｜Codex｜pnpm test:e2e --workers=1；後台操作證據見 `e2e/admin.spec.ts` 與 `apps/admin/src/`。 本機 fixture 驗收通過。 提交索引見 [commit-map.md](./commit-map.md#d01)。

## D02 後台框架及路由保護
- 參考圖：無原始後台設計稿；依 `02_規劃書/project/ui-templates.md` 與既有官網設計變數建立樣板。
- 目標：完成側欄、頁面標題、收合、選單及 session guard。
- 前置任務：D01。允許修改：admin shell/styles。
- 固定契約：所有管理路由需 authenticated + admin；錯誤有回饋。
- 步驟：建立 layout → 選單切換 → responsive sidebar → guard。
- 驗收：重新整理、逾時及手機寬度均正確；交接：附路由矩陣。

- 交接紀錄：2026-09-14｜Codex｜pnpm --filter @tian-xin-ge/admin typecheck && pnpm --filter @tian-xin-ge/admin build && pnpm test:e2e --grep "收合側欄" --workers=1；後台操作證據見 `e2e/admin.spec.ts` 與 `apps/admin/src/`，收合前後保留 `aria-label`、`aria-expanded` 與 `aria-current="page"`。 本機 fixture 驗收通過。 提交索引見 [commit-map.md](./commit-map.md#d02)。

## D03 素材列表及上傳
- 參考圖：無原始後台設計稿；依 `02_規劃書/project/ui-templates.md` 與既有官網設計變數建立樣板。
- 目標：預覽、篩選、上傳素材及編輯替代文字。
- 前置任務：B07、D02。允許修改：MediaEditor/repository。
- 固定契約：JPEG/PNG/WebP、10 MB、alt 最長 160 字。
- 步驟：list → file validation → upload → alt save → error state。
- 驗收：非法檔案拒絕、成功可預覽、RLS 生效；交接：附測試。

- 交接紀錄：2026-09-14｜Codex｜pnpm test:e2e --workers=1；後台操作證據見 `e2e/admin.spec.ts` 與 `apps/admin/src/`。 Dashboard 統一傳入素材資料，避免素材編輯器重複載入舊快照。本機 fixture 驗收通過。 提交索引見 [commit-map.md](./commit-map.md#d03)。

## D04 共用圖片選擇器
- 參考圖：無原始後台設計稿；依 `02_規劃書/project/ui-templates.md` 與既有官網設計變數建立樣板。
- 目標：服務、文章、首頁設定表單共用圖片選擇/替換。
- 前置任務：D03。允許修改：image picker、內容表單。
- 固定契約：只回傳 MediaAsset url/id/alt；不得直接讀 Storage 權限。
- 步驟：建立選擇器 → 接 service/article → 替換預覽 → 清除選取。
- 驗收：各表單可替換且無引用斷裂；交接：附操作截圖。

- 交接紀錄：2026-09-14｜Codex｜pnpm test:e2e --workers=1；後台操作證據見 `e2e/admin.spec.ts` 與 `apps/admin/src/`。圖片選擇器改由父層傳入已完成同步的素材清單。本機 fixture 驗收通過。 提交索引見 [commit-map.md](./commit-map.md#d04)。

## D05 網站基本設定
- 參考圖：無原始後台設計稿；依 `02_規劃書/project/ui-templates.md` 與既有官網設計變數建立樣板。
- 目標：編輯電話、LINE、地址、營業時間、社群及 SEO。
- 前置任務：B08、D02。允許修改：SettingsEditor/repository。
- 固定契約：line_url 由正式 LINE 連結產生；必填欄位保存前驗證。
- 步驟：欄位 → validation → save feedback → reload persistence。
- 驗收：官網重新整理讀到新值；交接：附前後資料。

- 交接紀錄：2026-09-14｜Codex｜pnpm test:e2e --workers=1；後台操作證據見 `e2e/admin.spec.ts` 與 `apps/admin/src/`。 本機 fixture 驗收通過。 提交索引見 [commit-map.md](./commit-map.md#d05)。

## D06 首頁區塊設定
- 參考圖：無原始後台設計稿；依 `02_規劃書/project/ui-templates.md` 與既有官網設計變數建立樣板。
- 目標：編輯首頁文案、背景及特色列，保持固定版型。
- 前置任務：D04、D05。允許修改：settings fields/components。
- 固定契約：只改內容與素材，不允許拖拉改版型。
- 步驟：欄位分組 → 圖片選擇 → 儲存 → 官網驗證。
- 驗收：主視覺/聯絡區同步更新；交接：附截圖。

- 交接紀錄：2026-09-14｜Codex｜pnpm test:e2e --workers=1；後台操作證據見 `e2e/admin.spec.ts` 與 `apps/admin/src/`。 本機 fixture 驗收通過。 提交索引見 [commit-map.md](./commit-map.md#d06)。

## D07 服務管理列表
- 參考圖：無原始後台設計稿；依 `02_規劃書/project/ui-templates.md` 與既有官網設計變數建立樣板。
- 目標：服務新增入口、排序、顯示/隱藏列表。
- 前置任務：B08、D02。允許修改：ServicesEditor list。
- 固定契約：排序以 sort_order 數值；slug unique。
- 步驟：列表 → 新增 draft → 排序欄位 → visible toggle。
- 驗收：列表與官網順序一致；交接：附 CRUD 流程。

- 交接紀錄：2026-09-14｜Codex｜pnpm test:e2e --workers=1；後台操作證據見 `e2e/admin.spec.ts` 與 `apps/admin/src/`。 本機 fixture 驗收通過。 提交索引見 [commit-map.md](./commit-map.md#d07)。

## D08 服務編輯表單
- 參考圖：無原始後台設計稿；依 `02_規劃書/project/ui-templates.md` 與既有官網設計變數建立樣板。
- 目標：編輯圖片、內容、時間、價格及洽詢狀態。
- 前置任務：D04、D07。允許修改：service form/repository。
- 固定契約：price 可空，空值顯示洽詢；name/slug 必填。
- 步驟：欄位驗證 → 儲存 → 錯誤回饋 → 官網同步。
- 驗收：價格只改一處且三個前台位置同步；交接：附測試。

- 交接紀錄：2026-09-14｜Codex｜pnpm test:e2e --workers=1；後台操作證據見 `e2e/admin.spec.ts` 與 `apps/admin/src/`。 本機 fixture 驗收通過。 提交索引見 [commit-map.md](./commit-map.md#d08)。

## D09 文章分類管理
- 參考圖：無原始後台設計稿；依 `02_規劃書/project/ui-templates.md` 與既有官網設計變數建立樣板。
- 目標：區分消息/部落格分類，使用中分類禁止刪除。
- 前置任務：B04、D02。允許修改：admin category screen/repository。
- 固定契約：category name unique；type 必須 news/blog。
- 步驟：list → add/edit → usage check → delete refusal。
- 驗收：分類查詢及刪除保護正確；交接：附錯誤畫面。

- 交接紀錄：2026-09-14｜Codex｜pnpm test:e2e --workers=1；後台操作證據見 `e2e/admin.spec.ts` 與 `apps/admin/src/`。 本機 fixture 驗收通過。 提交索引見 [commit-map.md](./commit-map.md#d09)。

## D10 文章管理列表
- 參考圖：無原始後台設計稿；依 `02_規劃書/project/ui-templates.md` 與既有官網設計變數建立樣板。
- 目標：依類型、狀態篩選與搜尋文章。
- 前置任務：B09、D02。允許修改：article list。
- 固定契約：草稿標籤、發布標籤及標題搜尋一致。
- 步驟：tabs → status filter → keyword → pagination。
- 驗收：消息/部落格與草稿數量正確；交接：附篩選矩陣。

- 交接紀錄：2026-09-14｜Codex｜pnpm test:e2e --workers=1；後台操作證據見 `e2e/admin.spec.ts` 與 `apps/admin/src/`。文章列表使用 Dashboard 已同步資料，避免子元件 repository 重複載入。本機 fixture 驗收通過。 提交索引見 [commit-map.md](./commit-map.md#d10)。

## D11 文章基本資料表單
- 參考圖：無原始後台設計稿；依 `02_規劃書/project/ui-templates.md` 與既有官網設計變數建立樣板。
- 目標：編輯標題、slug、摘要、封面、分類、發布日期及 SEO。
- 前置任務：D04、D10。允許修改：article form/repository。
- 固定契約：slug unique；標題必填；封面使用 MediaAsset。
- 步驟：欄位 → slug validation → category picker → save。
- 驗收：重新整理資料不遺失；交接：附欄位驗證。

- 交接紀錄：2026-09-14｜Codex｜pnpm test:e2e --workers=1；後台操作證據見 `e2e/admin.spec.ts` 與 `apps/admin/src/`。文章表單與封面選擇器共用父層已同步資料。本機 fixture 驗收通過。 提交索引見 [commit-map.md](./commit-map.md#d11)。

## D12 文章正文編輯器
- 參考圖：無原始後台設計稿；依 `02_規劃書/project/ui-templates.md` 與既有官網設計變數建立樣板。
- 目標：以受限 block editor 支援標題、段落、清單、連結與圖片。
- 前置任務：D04、D11。允許修改：body editor/validator。
- 固定契約：禁止任意 HTML；輸出 Article.body JSON schema。
- 步驟：block add/reorder → validate → preview JSON → save。
- 驗收：正文可重現，惡意 HTML 不渲染；交接：附 JSON fixture。

- 交接紀錄：2026-09-14｜Codex｜pnpm test:e2e --workers=1；後台操作證據見 `e2e/admin.spec.ts` 與 `apps/admin/src/`。正文圖片選擇器使用同一份已同步素材清單，發布前必須有至少一個正文區塊；空正文勾選發布時會保留草稿狀態並顯示原因。本機 fixture 驗收通過。提交索引見 [commit-map.md](./commit-map.md#d12)。

## D13 文章預覽與發布
- 參考圖：無原始後台設計稿；依 `02_規劃書/project/ui-templates.md` 與既有官網設計變數建立樣板。
- 目標：草稿保存、後台預覽、發布及下架。
- 前置任務：D11、D12。允許修改：preview/publish actions。
- 固定契約：公開查詢只回傳 published；下架立即失效。
- 步驟：save draft → preview → publish → unpublish → verify public。
- 驗收：草稿網址/搜尋/sitemap 均不可見；交接：附流程紀錄。

- 交接紀錄：2026-09-14｜Codex｜pnpm test:e2e --workers=1；後台操作證據見 `e2e/admin.spec.ts` 與 `apps/admin/src/`。缺少正文的文章只能保存為草稿，勾選發布會即時顯示原因，端到端發布流程再建立正文區塊。本機 fixture 驗收通過。提交索引見 [commit-map.md](./commit-map.md#d13)。

## D14 留言管理列表
- 參考圖：無原始後台設計稿；依 `02_規劃書/project/ui-templates.md` 與既有官網設計變數建立樣板。
- 目標：未處理/已處理篩選、分頁及空列表。
- 前置任務：B10、D02。允許修改：MessagesEditor list。
- 固定契約：留言依 created_at 倒序；只限 admin 讀取。
- 步驟：load → filter → pagination → empty/error states。
- 驗收：狀態數量及分頁正確；交接：附測試截圖。

- 交接紀錄：2026-09-14｜Codex｜pnpm test:e2e --workers=1；後台操作證據見 `e2e/admin.spec.ts` 與 `apps/admin/src/`。 本機 fixture 驗收通過。 提交索引見 [commit-map.md](./commit-map.md#d14)。

## D15 留言詳情與處理
- 參考圖：無原始後台設計稿；依 `02_規劃書/project/ui-templates.md` 與既有官網設計變數建立樣板。
- 目標：查看留言、編輯內部備註、標記處理及刪除確認。
- 前置任務：D14。允許修改：message detail/repository。
- 固定契約：備註不公開；刪除必須二次確認並受引用規則保護。
- 步驟：detail → note → mark handled → delete confirmation。
- 驗收：官網送出的留言可在後台正確處理；交接：附流程。

- 交接紀錄：2026-09-14｜Codex｜pnpm test:e2e --workers=1；後台操作證據見 `e2e/admin.spec.ts` 與 `apps/admin/src/`。 本機 fixture 驗收通過。 提交索引見 [commit-map.md](./commit-map.md#d15)。

## D16 政策內容管理
- 參考圖：無原始後台設計稿；依 `02_規劃書/project/ui-templates.md` 與既有官網設計變數建立樣板。
- 目標：編輯隱私權及服務條款並在政策頁同步。
- 前置任務：D05。允許修改：SettingsEditor policy fields。
- 固定契約：政策內容純文字/受限格式；不能注入任意 HTML。
- 步驟：輸入 → 儲存 → 官網 reload → policy link check。
- 驗收：兩頁顯示最新內容；交接：附前後截圖。

- 交接紀錄：2026-09-14｜Codex｜pnpm test:e2e --workers=1；後台操作證據見 `e2e/admin.spec.ts` 與 `apps/admin/src/`。 本機 fixture 驗收通過。 提交索引見 [commit-map.md](./commit-map.md#d16)。

## D17 後台操作整理
- 參考圖：無原始後台設計稿；依 `02_規劃書/project/ui-templates.md` 與既有官網設計變數建立樣板。
- 目標：統一儲存回饋、離頁提醒、錯誤訊息及載入狀態。
- 前置任務：D03～D16。允許修改：admin shared UI。
- 固定契約：所有儲存按鈕、錯誤、空狀態與 loading 文案一致。
- 步驟：盤點流程 → 抽 feedback component → dirty guard → 全頁驗證。
- 驗收：各模組可理解且無靜默失敗；交接：附 UX checklist。
- 交接紀錄：2026-09-14｜Codex｜pnpm --filter @tian-xin-ge/admin typecheck && pnpm --filter @tian-xin-ge/admin build && pnpm test:e2e --grep "收合側欄" --workers=1；後台操作證據見 `e2e/admin.spec.ts` 與 `apps/admin/src/`，收合側欄與正式資料載入／錯誤回饋語意一致；Dashboard 統一載入六組正式資料，子編輯器不再以重複查詢覆寫編輯中狀態。本機 fixture 驗收通過。 提交索引見 [commit-map.md](./commit-map.md#d17)。
