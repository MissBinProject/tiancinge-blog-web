# 實作狀態

目前已完成第一個可驗收切片：Next.js 官網、React/Vite 後台、共享 TypeScript 契約、設計素材匯入與裁切、公開路由及首頁全區塊。

各 Luna 任務的本機／正式環境狀態與交接證據請見 [`luna-tasks/status.md`](luna-tasks/status.md)；A01–E11 共 63 張任務卡，均已分開列出目標、契約、步驟與驗收。

## 已完成

- 固定導覽、手機選單、主視覺、服務、價格、消息、部落格、聯絡表單、頁尾。
- 官網與後台共用 `packages/design-tokens` 的色彩、字型、間距與圓角 CSS／TypeScript 變數。
- 服務／消息／部落格列表及詳情路由、分類分頁、搜尋、政策頁及 404。
- 消息／部落格列表提供可見分類 tab、分類篩選與分頁，沿用同一列表樣板。
- `POST /api/contact` 的必填、Email/長度驗證、限流、防重送及成功回應。
- 後台登入畫面、總覽、服務編輯、文章列表、素材上傳、留言與網站設定畫面。
- 後台首頁區塊編輯器可管理主視覺、服務／價格、消息、部落格、聯繫區文案與背景網址，以及消息特色列與價格信任列 JSON。
- 主視覺品牌字樣已直接使用 `SiteSettings.heroTitle`，後台修改主標題會同步反映在首頁視覺與語意標題。
- 預設主標題會使用素材中的 `天心閣_原色去背.png` 去背字樣以貼近設計稿；後台修改主標題後自動改用可編輯文字。
- Supabase 初始 migration、RLS policy 及含網站設定、服務、分類、文章的完整 seed 測試資料。
- 官網公開頁在設定環境變數後會讀取 Supabase 的服務、文章與網站設定，無設定時回退 fixture。
- 官網只有在未設定 Supabase 的本機模式回退 fixture；正式連線讀取失敗會進入公開錯誤頁，避免以測試聯絡資料取代正式內容。
- 正式 Supabase 設定列不再以 fixture 的電話、地址、LINE 或背景內容補值；缺少必要品牌／聯絡欄位會直接進入錯誤頁，只有完全未設定環境變數時才使用 fixture。
- Supabase Storage `site-media` bucket 與管理員上傳 adapter 已建立；素材會保存 MIME、大小、儲存路徑、替代文字與圖片寬高。
- 素材管理可刪除未被內容引用的素材；服務、文章封面、文章正文圖片及網站設定正在使用的素材，都由資料庫引用檢查拒絕刪除，Storage 物件清理失敗會回報警告。
- fixture 模式也會從服務、文章封面／正文圖片與網站設定讀取引用，拒絕刪除使用中的素材；使用中的文章分類同樣會被本機 adapter 拒絕刪除。
- 後台在設定 Supabase 時會載入並保存服務、文章、留言、素材及網站設定；未設定時使用 localStorage fallback。
- 文章後台支援消息／部落格分類、草稿／發布、摘要與結構化正文 JSON block 編輯。
- 後台文章支援類型／狀態／關鍵字篩選與分頁；留言支援狀態篩選、分頁、備註、處理及刪除確認。
- 後台文章支援 slug、封面、分類、發布日期與 JSON block 驗證；素材可上傳並保存替代文字；留言可標記處理及保存內部備註。
- 後台文章支援草稿／發布預覽、Escape 關閉預覽與未儲存變更提醒；服務、設定及文章欄位會在儲存前檢查長度、格式、網址、價格與 slug。
- 後台在側欄導覽與登出前會攔截尚未儲存變更，避免編輯內容被意外捨棄。
- 後台正式資料載入失敗時會在內容區顯示明確錯誤橫幅，並保留上次本機快照供檢查，不會靜默覆蓋編輯畫面。
- Supabase session 逾時或登入帳號失去管理員權限時，後台會清除本機 session 並在登入畫面顯示可理解的提示；手動登出不會誤顯示逾時訊息。
- 後台本機分類新增／編輯會先檢查全域名稱唯一性，與資料庫 `article_categories.name` unique constraint 保持一致。
- 官網加入 `Header.module.css` 的鍵盤跳至主要內容樣式，保留全站設計基準 CSS 的同時具備元件級 CSS Module 入口。
- Supabase 正式模式新增服務、文章或正文圖片時不會自動帶入 fixture 圖片；需由管理員選取已上傳素材，避免測試素材進入正式內容。
- 未設定 Supabase 的開發模式會在設定頁明確標示資料只保存於目前瀏覽器，避免誤以為已同步公開官網。
- 後台 fixture 已與公開 seed 對齊 8 篇文章及 7 個分類，方便列表、篩選與預覽流程使用同一組測試內容。
- 固定測試資料集中於 `packages/contracts/src/fixtures.ts`，官網 repository 與後台 localStorage／預覽 adapter 共用同一份設定、服務、文章、分類、留言及素材資料，避免畫面驗收時各自漂移。
- 後台切換服務／文章資料列時同樣會攔截尚未儲存變更，確認後才切換編輯對象。
- 後台服務與文章表單提供共用素材快速選擇器；網站基本設定可編輯品牌名稱、Logo 圖片網址及聯絡／SEO／政策內容。
- 服務編輯表單補上契約內五種卡片圖示選擇器，管理員可替換圖示且不會輸入任意 icon 值。
- 文章正文的 image block 也使用同一素材選擇器，可在正文中替換圖片並保留安全 URL 驗證。
- 文章支援獨立 SEO 標題／描述；正文支援安全連結與圖片 block，詳情頁會輸出對應 metadata。
- 文章封面與正文圖片共用安全 URL 驗證，管理員保存時及資料庫 constraint 都會阻擋危險協定。
- 服務、消息及部落格詳情頁 metadata 另帶 canonical 與對應封面／服務圖片的 Open Graph 分享資訊。
- 公開頁共用 `SafeImage`，圖片載入失敗時顯示可理解的「圖片暫缺」替代狀態並保留替代文字。
- Supabase migration 已加入 `admin_users` 與 `is_admin()`，公開讀取與管理寫入政策分離。
- 分類公開讀取政策只暴露仍被已發布文章使用的分類；只存在於草稿的分類也由本機 RLS 驗證拒絕匿名讀取。
- Supabase migration 另以資料庫 constraint 限制 slug／分類／留言欄位長度、特色列最多 4 筆，文章正文最多 100 個安全 block 且每個清單最多 100 個項目；同一套 URL／正文／特色列驗證規則也由 `packages/contracts` 提供給後台使用。
- Supabase migration 另外限制服務圖片、文章封面、網站設定圖片及文章正文圖片只能使用安全的 HTTPS 或站內路徑，LINE 與地圖 Embed URL 必須是 HTTPS；`pnpm db:verify` 覆蓋惡意服務圖片、文章封面、正文圖片及 LINE URL 案例。
- `scripts/export-crops.sh` 可依裁切座標重建服務／消息／部落格暫用卡片，不會修改原始設計稿。
- `scripts/generate-visual-diffs.sh` 可將五張設計稿與本機截圖輸出 overlay／difference 圖，供逐區差異定位。
- 視覺截圖腳本會等待字型載入並停用 animation／transition／caret，確保五張基準圖可重複產生。
- 首頁 metadata、canonical、Open Graph、sitemap 與 robots 已完成；LINE QR 由設定連結產生。
- 公開設定 mapper 會以正式 `line_url` 補足 social JSON 缺少的 LINE 欄位，讓導覽、預約按鈕與 QR 共用同一連結。
- 留言 API 以串流讀取方式限制 16 KB request body，即使沒有 `Content-Length` 也會在超過上限時中止；正式 Supabase 模式透過交易函式跨 instance 執行每 client 每分鐘五次限流與 30 秒防重送，本機 fixture 保留記憶體 fallback；共用圖片 URL validator 與資料庫 constraint 同步只接受 HTTPS 或站內路徑。
- 後台服務／文章 slug 在本機保存前也檢查唯一性；首頁特色列與文章 repository 在保存邊界重新驗證 JSON schema，不接受無效內容自動補值。
- 所有讀取正式內容的公開頁面使用 `force-dynamic` 伺服器渲染，後台儲存後重新整理即可讀取最新資料。
- 內頁與後台缺稿樣板已整理至 [`ui-templates.md`](ui-templates.md)，包含列表／詳情／搜尋結構、模組表單與載入／空資料／錯誤狀態。
- 公開列表、詳情、搜尋及政策路由均有獨立 canonical；留言 API 另加每 client 每分鐘五次提交限制。
- `supabase/scripts/backup.sh`、`restore.sh` 與 `supabase/backup-restore.md` 提供資料庫備份、校驗、明確確認後還原及交接驗證步驟。
- migration／seed 已在暫存 PostgreSQL（建立最小 `auth`／`storage` stub）實際執行，確認可建立 5 項服務、8 篇文章與 1 筆網站設定；另驗證文章正文圖片引用會被 `is_media_path_in_use()` 保護。這是 SQL 語法／constraint 檢查，正式 Supabase RLS／Storage 仍待專案驗證。
- 新增 `pnpm db:verify`／`supabase/scripts/verify-local.sh`，可重複建立暫存 PostgreSQL 並驗證匿名／唯一管理員 RLS、隱藏服務與草稿不可見、Storage MIME 限制、文章正文圖片引用保護及價格 constraint；正式 Supabase 仍需以實際專案重跑。
- 新增 `supabase/scripts/verify-backup-restore.sh` 與 `pnpm db:backup:verify`，已完成本機 custom-format 備份／checksum／異動／回復演練（5 項服務、7 篇已發布文章恢復）；正式 Supabase 仍待上線前演練。

## 待正式資料／營運設定

- 正式輸入欄位已整理至 [`production-input-form.md`](production-input-form.md)，填妥後才能進行 E10 與正式環境的 E11 演練。
- `pnpm preflight:production` 已提供部署前環境變數檢查；目前未設定正式值，因此預期會回報缺少欄位。
- 建立 Supabase Auth 單一管理員帳號、將 user id 寫入 `admin_users` 並在 Vercel 設定環境變數。
- 完成前台 Supabase repository 的正式資料填入與欄位確認（程式已具 fixture fallback）。
- 正式 Storage bucket 需執行 migration；未設定 Supabase 時後台素材預覽使用 local object URL。
- 由店家提供正式電話、地址、LINE、社群、地圖、字型與政策文字。
- 依原稿尺寸進行逐區截圖疊圖校正，並補齊手機稿與缺少的原始照片。

## 最近驗證

- `pnpm run typecheck`：通過。
- `pnpm run build`：官網與後台均通過。
- `pnpm test`：Vitest 3 個檔案、13 個測試通過，包含資料 fixture、單筆服務／文章公開 repository、Supabase 部分環境設定邊界、留言 API（含 JSON Content-Type、五次／分鐘限流）與共用內容安全規則驗證。
- `pnpm test:e2e --workers=1`：Playwright 17 個公開／後台流程通過，包含四種 viewport、手機選單 ARIA／錨點位置、內頁導覽目前區段、服務／文章／搜尋／政策內頁手機溢出、缺圖 fallback、404、聯絡表單成功／失敗保留內容、草稿公開限制（網址／搜尋／sitemap）、消息手動輪播與空白頁防護、所有價格卡導向官方 LINE、登入／登出／重設密碼輔助狀態、文章預覽、正文圖片素材選擇、狀態篩選、留言備註／處理、未儲存離頁提醒、品牌設定、素材篩選／尺寸顯示及使用中素材／分類刪除保護。
- `pnpm preflight:production`：檢查流程正常，因正式 Supabase、Vercel 網址與伺服器 key 尚未提供而依預期回報 7 個缺少欄位；未輸出任何 secret 值。
- `pnpm db:verify`：暫存 PostgreSQL migration／seed、匿名／管理員 RLS、Storage 限制、素材引用保護、正文 schema、LINE URL 及留言 guard 通過。
- `pnpm db:backup:verify`：暫存 PostgreSQL custom-format 備份、checksum、資料異動後回復及 5 項服務／7 篇已發布文章筆數驗證通過。
- 本機 smoke test：首頁、服務、消息、部落格、分類、搜尋、政策、sitemap、robots、404 及留言 API 均已檢查；後台登入、服務、文章、分類、素材、留言及設定畫面可操作。
- 1672px 主視覺／服務區段邊界及服務卡左右基準、價格區左側留白與卡片基準線均依原稿校正，並補回主視覺／聯繫區裝飾文案；重新產生五張 `visual-baseline/current-01..05.png`、overlay 及 difference；原始字型與照片差異仍保留在差異紀錄。
- 價格區依 `首頁_02.png` 補回左側直排、右上與右下手寫及底部英文裝飾文案；1672px 區段高度與特色列內距同步對齊原稿。
- 價格卡使用與服務卡相同的五組裁切圖示，固定置於圖片與標題之間，維持服務資料單一來源。
- 交付資料夾已初始化 Git repository，初始完整交付提交為 `3759e6e`（`feat: build Tian Xin Ge website and admin`）；各卡的驗收與交接仍以 `luna-tasks/status.md`、更新紀錄、截圖及可重跑命令保存，後續正式環境卡可再補逐卡提交 SHA。
- 價格卡 fixture／seed 描述改為原稿上的五組服務文案，首頁價格與服務詳情共用同一份內容。
- 價格卡的固定價格與「洽詢」課程入口都導向設定中的官方 LINE；新增 Playwright 回歸檢查五張卡的連結。
- 最新消息／部落格區補回設計稿的左右直排、手寫文案、底部英文與查看更多入口；暫用裁切圖的內嵌分類標籤由裁切容器與 live badge 對齊處理，避免重複顯示。
- 導覽預約按鈕改用可讀的行事曆圖示，LINE／Instagram／Facebook 社群入口套用品牌色，並以最新視覺基線留存回歸證據。
- 導覽社群入口改為可縮放的內嵌 SVG 圖示，避免使用文字字元造成不同平台的圖形漂移。
- 聯繫區 QR／社群面板共用同一套 SVG 品牌圖示並保留文字標籤，桌機基線已重新擷取。
