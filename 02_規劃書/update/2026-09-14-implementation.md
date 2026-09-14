# 2026-09-14 實作更新

## 本次完成

- 建立 pnpm workspace、Next.js 官網、React/Vite 後台及共享契約。
- 完成首頁、服務／消息／部落格列表與詳情、搜尋、政策、404、留言 API、SEO sitemap/robots。
- 公開消息／部落格列表補上可見分類 tab，訪客可直接切換分類並保留分頁。
- 完成固定導覽、手機抽屜、首頁各區與 390／768／1440／1672px 寬度檢查；四種寬度目前無水平溢出。
- 完成後台登入／重設密碼介面、單一管理員權限檢查、服務、文章／分類、素材、留言、網站設定與首頁區塊編輯。
- 完成 Supabase migration、RLS、Storage 權限及含設定／服務／分類／文章的 seed 測試資料；使用中的素材由資料庫函式阻擋刪除。
- 文章正文限制為 heading、paragraph、list、link、image block，網址通過安全協定驗證。
- 服務與文章表單共用素材選擇器，網站基本設定補上 Logo 圖片網址；公開內容頁改為動態伺服器渲染，儲存後重新整理即可更新。
- 補上各公開路由 canonical，留言 API 增加 client 頻率限制，並處理 Supabase 新增資料的正式 ID 回寫。
- 後台文章加入狀態／關鍵字篩選與分頁，留言加入狀態篩選、分頁及刪除確認。
- 補上後台文章預覽、Escape 關閉、未儲存變更提醒及服務／設定欄位驗證。
- 補上 ContactSection 非同步表單重置修正、API／共用內容安全規則 Vitest 驗證及 Playwright 十六條 smoke／流程測試（含 390／768／1440／1672px 溢出檢查、服務／文章／搜尋／政策內頁手機溢出、內頁導覽目前區段、設定欄位、素材篩選、留言處理、登入／登出／重設密碼輔助狀態與消息手動輪播空白頁防護）。
- Supabase migration 增加 slug、長度、價格、檔案 MIME／10 MB、文章正文 block schema 與單一管理員 trigger 約束。
- Supabase migration 將分類、留言 Email／備註與文章 block 數量上限也下沉到資料庫 constraint／validator。
- 共享契約補上 `isSafeContentUrl`／`isValidArticleBody`，後台編輯器與資料契約共用安全 URL、正文 block 數量及文字長度規則。
- 首頁特色列補上最多四筆及文字長度驗證，並在 Supabase `site_settings` 加入相同 schema constraint。
- 新增 PostgreSQL custom-format 備份／還原腳本、SHA-256 校驗與回復演練手冊；正式資料庫與 Storage 尚未提供，因此本輪只交付可重複執行的工具。
- 後台側欄導覽與登出會在有未儲存變更時顯示確認對話框，並保留瀏覽器關閉／重新整理警告。
- 後台切換服務／文章資料列時也會顯示未儲存變更確認，並以 Playwright 覆蓋該流程。
- 公開頁加入共用 `SafeImage` 缺圖 fallback，並在 Playwright 驗證失效圖片的替代狀態。
- 後台文章基本資料補上發布日期欄位與 ISO 日期驗證，保存時不再自動改成當天。
- 補上 `pnpm assets:export` 裁切流程，依 `crops/README.md` 座標可重建暫用卡片圖且保留原始設計稿。
- 補上 `scripts/generate-visual-diffs.sh` 與 `pnpm visual:diff`，可由五張設計稿及 current screenshot 產生 overlay／difference 驗收圖。
- 素材資料補上圖片寬高與儲存路徑欄位；後台上傳時讀取尺寸並在素材卡顯示，migration 也同步限制尺寸範圍。
- 使用暫存 PostgreSQL 與最小 `auth`／`storage` stub 實際執行 migration／seed，確認 SQL 可建立 5 項服務、8 篇文章與 1 筆設定；正式 Supabase 權限測試仍列為上線前工作。
- 依 1672px 原始價格稿校正價格區標題、卡片群水平基準、垂直節奏與特色列位置，並重新產生五張視覺 current／overlay／difference 圖。
- 後台本機 fixture 補齊 8 篇文章及 7 個分類，與公開 seed 保持一致。
- 將固定測試資料集中到 `packages/contracts/src/fixtures.ts`，官網與後台共用設定、服務、文章、分類、留言及素材 fixture；後台文章正文仍在 adapter 邊界轉為編輯器使用的 JSON 字串。
- 素材管理新增未引用素材刪除流程；資料庫先執行引用保護檢查，再清理 Storage 物件並回報清理警告。
- `is_media_path_in_use()` 也會掃描文章正文的 image block，避免刪除只在正文中引用的素材；已在暫存 PostgreSQL 驗證。
- 文章封面與正文圖片 URL 在後台保存前及 repository 層共用安全協定驗證；開發模式設定頁明確標示只保存於目前瀏覽器。
- 依 1672px `首頁_03.png`～`首頁_05.png` 完成消息／部落格卡片與控制、聯繫表單／地圖／社群欄、頁首及頁尾版心校正；重新產生五張 current／overlay／difference 圖。
- fixture adapter 補上素材與文章分類的本機引用保護，與 Supabase RLS／FK 的刪除規則保持一致；Playwright 流程擴充為 16 條，涵蓋正文圖片素材選擇、最新消息輪播邊界、內頁導覽目前區段、登入／登出／重設密碼輔助狀態、聯絡表單失敗保留內容與內頁手機溢出。
- 留言 API 測試補上每個 client 每分鐘五次的限流情境，並補上單筆服務／文章 repository 的公開狀態測試，Vitest 通過數增加為 8 項。
- 新增 `pnpm db:verify` 的暫存 PostgreSQL 驗證腳本，重複執行 migration／seed 並通過匿名／管理員 RLS、隱藏服務／草稿不可見、Storage MIME、正文圖片引用及價格 constraint 檢查。
- 資料庫文章正文 validator 補上每個清單最多 100 個項目的限制，並由 `pnpm db:verify` 覆蓋直接寫入的超量案例。
- 文章正文圖片 block 補上共用素材選擇器，正文圖片與封面／設定圖片可使用同一素材來源。
- migration 明確啟用 `storage.objects` RLS，讓 Storage policy 不依賴專案預設設定。
- 補回主視覺與聯繫區原稿的英文／手寫／直排裝飾層，並重新產生五張 1672px current／overlay／difference 圖。
- 新增 `ui-templates.md` 內頁／後台 wireframe 與 `ui-ux-plan.md` 響應式配置矩陣，明確記錄 390／768px 的推定規則與待補手機稿項目。
- 補完整 `data-api-plan.md` 的資料界線、公開／管理 repository、留言 API 狀態碼及正文／素材安全契約，讓後續 Luna 卡可依同一份接口交接。
- 關閉 Next.js 開發指示器並重產五張視覺基準，避免開發浮標進入設計稿疊圖。
- 主視覺預設改用現有 `天心閣_原色去背.png` 去背字樣；若後台修改主標題則保留文字渲染，確保內容仍可管理。
- 新增 `production-input-form.md`，集中整理店家正式聯絡資料、原始素材、Supabase／Vercel 設定與 E10／E11 簽核欄位。
- 完成 A01–E11 共 63 張 Luna 任務卡的 ID、依賴、契約、操作步驟與驗收欄位檢查，並以 `luna-tasks/status.md` 維護本機／正式環境交接狀態。
- 收緊文章分類 RLS：匿名只可讀取仍被已發布文章使用的分類，並在 `pnpm db:verify` 加入草稿專用分類越權案例。
- 新增 `pnpm preflight:production` 部署前檢查，驗證七個官網／後台環境變數與網址格式，且不輸出任何 secret 值。
- 後台 remote repository 讀取失敗時新增全域錯誤橫幅，明確提示目前顯示本機快照，避免正式環境網路錯誤被靜默掩蓋。
- 公開 repository 在有 Supabase 環境變數時不再以 fixture 掩蓋讀取錯誤；錯誤交由公開 error boundary 呈現，避免測試聯絡資料外洩。
- 補上 Supabase 部分環境變數的單元測試；部分設定不再落回 fixture，留言 API 也不會在無法建立伺服器 client 時假回成功。Vitest 現為 10 項通過。
- 將服務圖片、文章封面、網站設定圖片、文章正文圖片與地圖 URL 的安全格式下沉到 PostgreSQL constraint，並在 `pnpm db:verify` 加入惡意 URL 寫入拒絕案例。
- 視覺截圖腳本在等待字型後固定停用 animation／transition／caret，再重新產生五張 current／overlay／difference 基準圖。
- 公開設定 mapper 在 social JSON 缺少 LINE 欄位時改以同一筆正式 `line_url` 作為 fallback，確保 Header、預約按鈕與 QR 指向一致。
- 留言 API 增加無 `Content-Length` 時的實際 body byte 上限檢查；共用圖片網址驗證器與 PostgreSQL constraint 對齊為 HTTPS／站內路徑，避免本機與正式環境規則不一致。
- 後台服務／文章 slug 增加本機唯一性檢查；首頁特色列與文章 repository 在最終保存邊界重新驗證 JSON，無效正文不再自動降級成段落。
- 消息區輪播依原稿保留三筆以上的左右箭頭與圓點，改為循環卡片視窗避免切換到空白頁；少於三筆時隱藏控制項。
- Storage migration 遇到既有 `site-media` bucket 時會強制維持 public read，避免既有 bucket 設定讓公開素材 URL 失效；本機資料庫驗證已重跑通過。
- 留言 API 正式 Supabase 模式新增 digest guard 與交易函式，跨 Vercel instance 維持每 client 每分鐘五次限流及 30 秒防重送；本機模式仍使用記憶體 fallback，避免 fixture 流程需要外部服務。
- 正式設定 mapper 抽出為可測試函式，LINE URL 僅接受 HTTPS；sitemap／robots 正規化正式網址尾斜線，避免產生雙斜線 URL。
- Supabase 模式新增服務、文章或正文圖片時不再自動帶入 fixture 圖片；無效或缺少正式素材會留給管理員修正。
- 新增 `packages/design-tokens`，官網與後台共用色彩、字型、間距及圓角變數，並更新 workspace lockfile 與建置驗證。
- 將首頁消息特色列與價格信任列拆成兩組設定，補上 Supabase 欄位、seed、後台 JSON 編輯與價格區文案，修正原稿兩區文案混用差異。
- 後台 Supabase session 逾時與管理員權限失效時補上登入畫面提示；手動登出維持安靜返回登入頁，避免誤導管理員。
- 服務編輯表單補上固定五種卡片圖示選擇器，讓後台可管理完整服務資料。
- 分類管理在本機保存前補上全域名稱唯一性檢查，與 Supabase unique constraint 對齊。
- 官網 Header 新增 CSS Module 的鍵盤跳轉連結，讓鍵盤使用者可直接跳至主要內容。
- 價格區依 `首頁_02.png` 補回左側直排、右上與右下手寫及底部英文裝飾文案，並校正 1672px 區段高度、特色列內距及五組價格描述。
- 價格卡補上與服務卡共用的五組原稿裁切圖示，圖示不改變既有卡片資料與預約流程。
- 交付資料夾已初始化 Git repository，初始完整交付提交為 `3759e6e`（`feat: build Tian Xin Ge website and admin`）；交接證據以任務狀態、更新紀錄、截圖及可重跑命令保存，正式環境卡完成後再補逐卡提交 SHA。

## 驗證

```text
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run build
pnpm test
pnpm test:e2e --workers=1
```

以上命令均通過（當時版本為 Vitest 12、Playwright 16）；另 `pnpm db:verify` 通過本機資料權限與 constraint 檢查；本機 smoke test 已確認公開路由、404、留言 API（400／200／413／429）及後台主要路由。`pnpm preflight:production` 的檢查流程正常，但因正式環境尚未提供而依預期回報 7 個缺少欄位。

## 追加驗證

- 後台 Playwright 流程補上服務新增／排序／顯示狀態，以及文章建立／發布；目前 `pnpm test:e2e --workers=1` 共 19 條通過。
- 聯絡 API 增加 JSON Content-Type 邊界測試，Vitest 目前共 13 條通過；`pnpm build`、`pnpm tasks:verify`、`pnpm db:verify` 與 `pnpm db:backup:verify` 亦已重跑通過。

## 待店家／上線前處理

- Supabase project、唯一 Auth 管理員 user id、Vercel 專案與正式網域。
- 正式電話、地址、LINE、社群、地圖、政策、文章、字型及原始卡片照片。
- 以正式資料執行 RLS／Storage 越權測試、完整 Playwright 流程與設計稿疊圖；目前裁切卡片仍是由設計稿裁切的暫用素材。
## Luna 任務交接索引補齊

- 63 張 A01–E11 任務卡的 `交接紀錄` 已填入 2026-09-14 執行者、驗證命令、證據路徑與本機／正式狀態。
- 新增 `02_規劃書/project/luna-tasks/commit-map.md`，逐卡列出相關提交 SHA，並明確標示群組提交與正式環境待辦。
- `scripts/verify-task-cards.mjs` 現在會拒絕仍保留未填寫交接範本的卡片。
- 驗證：`pnpm tasks:verify`、`git diff --check` 通過。
- 後台文章新增刪除操作，Supabase 與 local fixture adapter 均支援；Playwright 回歸流程增至 20 條。
- fixture 素材列表改用實際檔案大小；後台設定可處理只提供 `line_url` 的正式設定資料。
- 首頁部落格分類入口改由已發布文章分類產生，並新增公開端到端檢查；Playwright 回歸流程增至 21 條。
- 首頁部落格卡片維持四張設計版型，分類入口則取全部已發布文章，避免第五篇文章的分類遺失。
- 正式 Supabase 的文章／分類 adapter 改為拒絕跨類型同名分類，避免保存文章時改寫既有分類類型。
- 留言限流與防重送 guard 表新增兩天保留期清理，並通過本機 migration／備份回復演練。
- `supabase/scripts/verify-local.sh` 新增過期 guard 清理探針，先由 owner 建立測試資料，再以 app role 驗證交易函式可清理且不放寬 RLS。

## 鍵盤主要內容錨點修正

- 將根 layout 的外層 `#main-content` 改為各公開頁真正的 `main#main-content`，讓 Header 的「跳到主要內容」不會把焦點留在導覽列之前。
- `e2e/public.spec.ts` 新增 `main#main-content` 唯一性與連結目標檢查。
- 驗證：`pnpm --filter @tian-xin-ge/web typecheck`、`pnpm --filter @tian-xin-ge/web build`、`pnpm test:e2e --workers=1 e2e/public.spec.ts`（10 條）通過；相關提交為 `705d6dc`、`c3e2c35`、`234fbe7`。
- 全站 `main#main-content` 增加固定 Header 高度相容的 `scroll-margin-top`，桌機 76px、手機 66px。
- 各頁 `main#main-content` 加入 `tabIndex={-1}`，Playwright 驗證跳轉後 `document.activeElement` 為主要內容。
- 後台 Dashboard 在 Supabase 資料載入完成前顯示 `aria-busy` 載入遮罩並暫不掛載內容編輯區，避免滑鼠或鍵盤使用初始 fixture 值覆寫正式資料；提交 `15123a6`。
- 素材引用檢查函式撤銷 public 執行權限，僅保留 authenticated／service_role（本機驗證用 app_user）；`pnpm db:verify` 已確認匿名替身不能執行、app_user 仍可供 Storage policy 使用。

## 公開表單欄位可及性與輪播語意

- 聯絡表單姓名、電話、Email 與留言欄位補上可讀 `aria-label`；姓名／電話／Email 分別提供瀏覽器可辨識的 `autocomplete` 值。
- 最新消息手動輪播控制群組補上 `role="group"` 與中文 `aria-label`，保留原有上一頁／下一頁／圓點操作。
- 提交 `21d8668`；驗證：`pnpm --filter @tian-xin-ge/web typecheck`、`pnpm --filter @tian-xin-ge/web build`、`pnpm test:e2e --grep public --workers=1`（10／10 通過）。

## 首頁部落格分類完整性

- 首頁分類入口改為列出所有已發布文章分類，避免固定五筆上限造成後台新增分類後入口遺失。
- 提交 `c9001d4`；驗證：`pnpm --filter @tian-xin-ge/web typecheck`、`pnpm test:e2e --grep "首頁部落格分類入口" --workers=1`（1／1 通過）。

## 政策頁 SEO 分享資訊

- 隱私權與服務條款頁改用 `generateMetadata` 讀取網站設定，輸出動態標題、描述、canonical 與 Open Graph 分享資訊。
- 提交 `6329f57`；驗證：`pnpm --filter @tian-xin-ge/web typecheck`、`pnpm --filter @tian-xin-ge/web build`、`pnpm test:e2e --grep "政策頁提供" --workers=1`（1／1 通過）。

## Supabase singleton 競態保護

- `enforce_single_admin` 與 `enforce_single_site_settings` trigger 在存在性檢查前加入交易級 advisory lock，確保併發插入／upsert 仍維持單一管理員與單一設定列。
- 提交 `665280c`；驗證：`pnpm db:verify`、`pnpm db:backup:verify` 通過。

## 服務詳情多行介紹

- 服務詳情的介紹段落加入 `detail-description`，以 `white-space: pre-line` 保留後台內容換行，維持療程文案的排版節奏。
- 提交 `61c8616`；驗證：`pnpm --filter @tian-xin-ge/web typecheck`、`pnpm test:e2e --grep "公開文章與服務路由" --workers=1`（1／1 通過）。

## 服務卡長文案排版

- 服務卡摘要移除固定單行限制，加入自然換行與長字串折行，避免後台文案變長時破壞手機版版面。
- 提交 `b5e7471`；驗證：`pnpm --filter @tian-xin-ge/web typecheck`、`pnpm test:e2e --grep "首頁桌機與手機版" --workers=1`（1／1 通過）。

## 後台收合側欄可及性

- 收合／展開按鈕改用狀態化 `aria-label` 與 `aria-expanded`；側欄導覽項目補上固定可讀名稱與 `aria-current="page"`，收合後仍可由鍵盤與讀屏辨識目前頁面。
- 提交 `7267c23`；驗證：`pnpm --filter @tian-xin-ge/admin typecheck`、`pnpm --filter @tian-xin-ge/admin build`、`pnpm test:e2e --grep "收合側欄" --workers=1`（1／1 通過），後台 grep 回歸 11／11 通過。

## 手機版單欄與消息輪播配置

- 依 A05／UI 配置矩陣補上 390px 單欄服務、價格、部落格及內頁列表，特色列改為縱向排列；消息輪播以媒體查詢切換為手機每頁一張，桌機仍維持三卡循環視窗。
- 提交 `5a352f7`；驗證：`pnpm --filter @tian-xin-ge/web typecheck`、`pnpm --filter @tian-xin-ge/web build`、`pnpm test:e2e --grep "首頁桌機與手機版|最新消息手動輪播" --workers=1`（2／2 通過）、`pnpm test:e2e --grep "內頁在手機版" --workers=1`（1／1 通過）。

## 後台共用正式資料載入

- 修正後台正式資料載入競態：Dashboard 現在一次載入服務、文章、分類、素材、留言與網站設定，並將已同步資料與 setter 傳給各編輯器及共用圖片選擇器；子元件不再各自啟動第二次 repository 查詢，避免使用者編輯期間被舊快照覆寫。
- 提交 `e9f4eef`；驗證：`pnpm --filter @tian-xin-ge/admin typecheck`、`pnpm --filter @tian-xin-ge/admin build`、`pnpm test:e2e --grep "後台|正文圖片" --workers=1 --reporter=line`（12／12 通過）。
