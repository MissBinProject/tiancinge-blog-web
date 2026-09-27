# 最終發布驗證

## 目前有效的最新狀態（2026-09-20 20:01 Asia/Taipei）

- 最新 Firebase Hosting version：`sites/tiancinge-web/versions/25abcd202eb42249`；release：`sites/tiancinge-web/releases/1789905026919000`。
- 最新 sitemap worker：`tiancinge-sitemap-robots-search-20260920`，100% traffic；source archive generation `1789905058162523`。
- 最新 API revision：`tiancinge-web-totp-replay-20260920`，100% traffic。
- `/sitemap.xml` 仍為 17 個唯一 HTTPS URL，HTTP 200、`application/xml; charset=utf-8`，一般 UA 與 Googlebot body SHA-256 均為 `bdb47a5b0b0696a6eb2beef1173599f02fe691b34676c30a3ebda11e813f31e2`。
- `/robots.txt` 目前內容包含 `Allow: /`、`Disallow: /search`、`Disallow: /api/`、`Disallow: /admin` 與 sitemap 宣告；`/search` 仍可訪問但由頁面 `noindex, follow` 並同步 robots 排除。
- 最新 `pnpm seo:baseline`：13 個基準路由、17 個 sitemap URL 通過；Web 53 tests、Admin 14 tests、sitemap worker 28 tests、Web/Admin typecheck、Admin build、E2E 13 passed／19 skipped 均通過。
- Cloud Logging 最近 24 小時 `severity>=ERROR` 點驗：`tiancinge-web` 與 `tiancinge-sitemap` 均沒有錯誤事件；這是時間點觀測，不取代正式 24 小時驗收。

## 20:06 最新正式端點回歸

- `python3 scripts/verify-sitemap.py`：17/17 sitemap URL 通過；XML、MIME、Googlebot parity 與 robots 規則均通過。
- `pnpm seo:audit`：17 個 sitemap route、0 errors；逐路由表格已更新至 [`route-audit-2026-09-20.tsv`](route-audit-2026-09-20.tsv)，JSON 稽核輸出已更新至 [`seo-audit-2026-09-20.json`](seo-audit-2026-09-20.json)。
- 全部公開路由 `/`、列表、分類、詳情、政策頁、搜尋、編輯團隊頁及不存在路由均重新取得；索引頁 HTTP 200，負向路由 HTTP 404。
- 目前仍有 3 篇消息與 5 個服務詳情的內容品質警示，這些是正文資料不足的內容問題，不是 HTTP、canonical、robots 或 sitemap 格式錯誤。
- 390px iPhone 13 三次中位數效能基準已保存至 [`mobile-performance-latest-2026-09-20.json`](mobile-performance-latest-2026-09-20.json)：首頁 LCP 508ms／CLS 0.0072／TBT 0ms，服務頁 436ms／0.0080／0ms，消息頁 436ms／0.0097／0ms，部落格 436ms／0.0083／0ms。此為未模擬網路節流的瀏覽器基準，不取代 Lighthouse 或 CrUX field data。

## 程式驗證

- `pnpm test:sitemap`：27 tests passed。
- `pnpm --filter @tian-xin-ge/web test -- --run`：14 files、46 tests passed。
- `pnpm --filter @tian-xin-ge/web typecheck`：passed。
- `git diff --check`：passed。
- `pnpm seo:audit`：17 sitemap routes passed；無 duplicate title/description、canonical 或 noindex 錯誤。
- 追加 breadcrumb 稽核：`scripts/audit-indexability.mjs` 現在對 `/services/**`、`/news/**`、`/blog/**` 要求可爬取 `.breadcrumbs`，最新輸出保存在 [`seo-audit-2026-09-20.json`](seo-audit-2026-09-20.json)。
- 內容品質警示：3 篇既有消息正文偏短（33、28、27 字）；已列入 D03 待店家確認清單，未因固定字數自動刪除或改寫真實活動內容。
- 服務詳情頁新增「其他服務項目」標準 HTML 內鏈；live audit 顯示每個服務頁由 6 個內鏈提升為 10 個內鏈。

## 正式網站

- `python3 scripts/verify-sitemap.py`：17 個 sitemap URL 驗證通過。
- `sitemap.xml`：HTTP 200、`application/xml; charset=utf-8`、17 個唯一 HTTPS URL。
- `robots.txt`：HTTP 200、`text/plain; charset=utf-8`，包含 sitemap 宣告並禁止 `/api/`、`/admin`。
- Googlebot UA 與一般 UA 取得相同 sitemap body。
- `/privacy` 與 `/terms` 仍 HTTP 200、可直接存取，但不再列入 sitemap。
- 服務詳情頁：HTTP 200、self-canonical、唯一 title/description、單一 H1，完整 HTML 直接存在 response。
- 首頁、隱私權政策、服務條款與 LocalBusiness 結構化資料已同步電話 `02-2338-1111`、地址 `108台北市萬華區桂林路2之5號`；地圖 Embed URL 也已同步。

## 發布識別

- Cloud Build：`e7972db8-491e-4669-983e-cf28ec22dc0f`，SUCCESS。
- Hosting version：`sites/tiancinge-web/versions/61a7ee10532bf8fe`。
- Public snapshot digest：`8e5c0e73473dc748ac069d5748e348e71de1f73fe561849656d20a35d340d99a`。
- Static source archive：`gs://tiancinge_asia-east1_cloudbuild/static-site/source-f87c7d06e03799110aa30f7434901aa939b0af10c3025f18966ec2996f3c370d.tar.gz`，generation `1789864677114872`。
- worker status：`published`、`count: 17`；回應仍保留歷史 `failedAt` 欄位，但目前 release 與 Hosting version 已成功發布。

## 追加發布（列表與分頁 SEO）

- Cloud Build：`0a61c0f9-0ed5-4eec-91ce-e80147a7f8e4`，SUCCESS。
- Hosting version：`sites/tiancinge-web/versions/2d47b9a2f9ad98b8`。
- sitemap worker：`published`，17 個 URL；`/services`、`/news`、`/blog` 與服務詳情頁已驗證直接回傳 breadcrumb HTML。
- 最新 worker revision：`tiancinge-sitemap-00026-lwz`；後續自動建置來源已更新為 `gs://tiancinge_asia-east1_cloudbuild/static-site/source-e58f75234e714c960a1f9f5a5b39db83e3a1f1d55fe98127a17e4b18c2f03143.tar.gz`，generation `1789866699358182`。

## 追加發布（服務描述去重與最終來源）

- Cloud Build：`52a17c76-024e-4317-9f28-d2916a1cf346`，SUCCESS（2026-09-20T01:18:56Z）。
- Hosting version：`sites/tiancinge-web/versions/472ca8b4834d4d4f`；release：`sites/tiancinge-web/releases/1789867139486000`。
- sitemap worker revision：`tiancinge-sitemap-00027-vnz`；回應 `published`、`count: 17`、`elapsedMs: 6230`。
- Static source archive：`gs://tiancinge_asia-east1_cloudbuild/static-site/source-bb8d22afeddb51efddb9809e7ed48c20e070f8ac2ca27516c73ab1b73f2f0e48.tar.gz`，generation `1789866890374036`。
- 服務詳情頁已避免卡片摘要與詳細內容重複；以 `/services/0p38fpahrm` live response 驗證 title、meta description、可見摘要、可見詳細內容與 JSON-LD 均一致。

## 最終 live smoke（2026-09-20）

- `/`、`/services`、`/news`、`/blog`、`/services/0p38fpahrm`、`/sitemap.xml`、`/robots.txt` 均回 HTTP 200；列表與詳情頁直接回傳 `text/html`，sitemap 回傳 `application/xml`，robots 回傳 `text/plain`。
- `python3 scripts/verify-sitemap.py`：17 個 HTTPS sitemap URL 驗證通過；XML namespace 的 `http://www.sitemaps.org` 不屬於 `<loc>` URL，不能誤判為非 HTTPS 連結。
- 一般 UA 與 `Googlebot/2.1` 皆回 HTTP 200、`application/xml; charset=utf-8`，兩次 response body 完全一致，包含 17 個 `<loc>`。
- 服務頁 live response：title `精油按摩｜天心閣養生會館`、description `香氛療癒・放鬆身心。喚醒身體能量`，並包含 breadcrumbs、摘要與額外詳細內容。
- 最新 `seo:audit` 已加入圖片替代文字欄位稽核：17 個 sitemap route 均沒有缺少 `alt` 屬性的圖片；首頁與文章詳情的重複 alt 目前被列為人工確認警示，原因是同一服務卡片／文章封面可能在同頁重複出現，未自動改寫真實內容。
- Playwright E2E：`pnpm test:e2e` 13 tests passed（公開站 11、帳號登入安全流程 2），覆蓋桌機與 390px／768px 手機版、分類路徑、政策 metadata、404、草稿隔離、表單與水平溢出；19 個需要管理員測試資料的案例依設定略過。
- `playwright.config.ts` 將 E2E worker 固定為 1，避免 Next/Vite 共用本機建置 manifest 時並行寫入造成偶發 `Unexpected end of JSON input`；序列化後完整 E2E 回歸穩定通過。
- 部落格詳情 `/blog/lob01tcsx5` live response 回 HTTP 200，主要內容約 1,702 字，包含使用者提供的泡腳、腳底按摩與忙碌生活段落，並有 7 張圖片與 1 個影片媒體元素；地址文字也已同步至桂林路資料。

## 尚待外部或人工資料

- Search Console 已在 `https://tiancinge-web.web.app/` property 重新提交 `sitemap.xml`，畫面顯示「已成功提交 Sitemap」；目前詳細頁顯示上次讀取 `2026/9/20`、狀態「無法擷取／0」，訊息為「無法讀取 Sitemap」，但沒有提供可操作錯誤碼。這是 Google 端仍未完成可判斷處理的外部狀態，不能宣稱已成功擷取。
- 每週營業日、服務流程與 2025 活動有效期尚未由店家確認；相關內容優化不臆測發布。

## 追加發布（靜態 Hosting 安全標頭）

- 本次修改：`firebase.static.json` 對靜態官網全站加入 `Content-Security-Policy-Report-Only`，並明確保留 `X-Frame-Options`、`Permissions-Policy`、`Referrer-Policy` 與 `X-Content-Type-Options`；CSP 仍是觀察模式，未直接 enforce。
- 本機 static export：17 個 sitemap URL、canonical/title/description/main 驗證通過；`pnpm test:sitemap` 為 27 tests passed。
- Firebase Hosting candidate：`static-cdcd7b9c`；worker 發布序號 `20`，正式版本：`sites/tiancinge-web/versions/ef9a46f041f5ccbe`，release：`sites/tiancinge-web/releases/1789870178416000`。
- worker：`tiancinge-sitemap-00027-vnz` 回報 `published`、`count: 17`；source archive 已更新為 `gs://tiancinge_asia-east1_cloudbuild/static-site/source-57e9c293980754a5a8eaa8af7b4afd15c209fa124da73ebc4b3bb764b02fec36.tar.gz`，generation `1789870312374953`。
- 為確保後續 Firestore 事件使用同一份程式，worker 已更新至 revision `tiancinge-sitemap-00028-kz4`，環境變數已鎖定上述 source object/generation。
- live header smoke：`/`、`/services/0p38fpahrm`、`/blog/lob01tcsx5`、`/sitemap.xml`、`/robots.txt` 均 HTTP 200，且回應含 CSP Report-Only；sitemap 仍為 `application/xml; charset=utf-8`，robots 仍為 `text/plain; charset=utf-8`。

## 追加發布（後台內容品質提示）

- 後台發布文章時新增非阻擋式 SEO 提示：正文少於 120 字、摘要空白、SEO 描述空白或封面缺少替代文字時，儲存後顯示提醒；不會自動改寫、刪除或阻止店家保存草稿。
- 共用 contracts 新增 `articleBodyTextLength`，會計算段落、標題、清單與媒體說明文字；新增 3 個品質計算測試。
- Admin Hosting version：`sites/tiancinge-admin/versions/ec3a8dbb8c33159f`；release：`sites/tiancinge-admin/channels/live/releases/1789871171145000`，發布者 `ouyangtaisen@gmail.com`。
- Admin live smoke：`https://tiancinge-admin.web.app/` HTTP 200、`noindex` 保留，正式 JS bundle 含品質提示；`pnpm --filter @tian-xin-ge/admin test -- --run` 為 11 tests passed，typecheck/build 通過。

## 追加維護文件同步（2026-09-20）

- 根目錄 `README.md`、`apps/sitemap-worker/README.md` 與 web release guard 已改為以靜態 Hosting 發布流程為準；舊的 `deploy:web:hosting` 動態流程只保留歷史辨識，避免後續維運誤把公開頁切回 Cloud Run catch-all。
- 最後文件驗證：`git diff --check` 通過；`pnpm tasks:verify` 通過（63 張任務卡）；`pnpm test:sitemap` 通過（27 tests）。

## 追加安全修正（2026-09-20）

- Cloud Run API revision `tiancinge-web-recycle-api2-20260920` 已切換 100% 流量；匿名管理 API 仍回 401，公開 Hosting、robots、sitemap 與 contact method guard 回歸通過。
- 文章、服務、分類、素材與留言 DELETE 已改為 `deletedAt/deletedBy` 回收標記；後台列表、公開 repository 與 sitemap worker 排除回收資料，Storage 物件保留供受控復原。
- sitemap worker revision `tiancinge-sitemap-00034-g5p` 已部署，並鎖定 source archive generation `1789879491998335`，確保後續自動靜態建置包含回收、API 與圖片 alt 修正。
- 新增回收資料與回收管理 API 測試後，`pnpm --filter @tian-xin-ge/web test -- --run` 為 46 tests passed，`pnpm test:sitemap` 為 27 tests passed，Web/Admin typecheck 與 Admin build 通過。
- 回收復原相容性追加：API 復原同時清除 `deletedAt/deletedBy` 與 legacy `deleted_at`；Cloud Run `tiancinge-web-recycle-api2-20260920`、sitemap worker `tiancinge-sitemap-00034-g5p` 已完成部署，匿名回收列表／操作分別維持 401／403，Cloud Logging 無 ERROR。
- 圖片替代文字追加：服務卡、價格卡、列表封面、詳情封面與文章內文圖片加入用途及位置上下文；最新 live SEO audit 已移除重複 alt 警示，只保留 3 篇短消息正文的內容審核警示。
- 最新靜態 Hosting live：version `sites/tiancinge-web/versions/85d3bb507721c571`、release `sites/tiancinge-web/releases/1789878028828000`、worker sequence `23`；最新 worker source archive 為 `source-8364505f276764ac9482da143823717a6f143e846a92fc2e83c5d0233df99148.tar.gz`（generation `1789879491998335`）。
- 手機 Lighthouse（390px、每路由 3 次）中位數已保存：首頁 performance 88、LCP 2,982ms、CLS 0.0026、TBT 260ms；服務 94／2,779ms／0.0062／96ms；消息 94／2,799ms／0.0046／97ms；部落格 93／2,868ms／0.0043／99ms，JS 與圖片傳輸量同步記錄於效能證據檔。

## 追加發布（Firestore cursor 分頁）

- `loadArticlePage` 已由頁碼 `offset` 改為以 `publishedAt desc, __name__ desc` 穩定排序，使用上一頁最後一筆 DocumentSnapshot 的 `startAfter` 逐頁取資料；列表仍只投影 `ARTICLE_LIST_FIELDS`，詳情維持 slug 精確查詢。
- Web 46 tests、Web typecheck 通過；候選 revision `tiancinge-web-cursor20260920` 已先以 tag smoke，再切換 Cloud Run 100% 流量。匿名回收列表仍 HTTP 401，首頁與安全標頭 smoke 通過；前一個 `tiancinge-web-recycle-api2-20260920` 保留作回退。
- sitemap worker 候選 `tiancinge-sitemap-cursor-20260920` 已切換 100% 流量，環境鎖定 source archive `gs://tiancinge_asia-east1_cloudbuild/static-site/source-253716e13f037bf862ed68aa96ac1a615f0c5f5766904489e7c1d4557697ae4a.tar.gz`（generation `1789880563111144`）；後續 Firestore 事件建置會包含 cursor 分頁程式。

## 追加安全修正（文章詳情回收隔離）

- 公開 `loadArticle` 精確查詢現在會先檢查 `deletedAt`／legacy `deleted_at`，已回收文章即使知道 slug 也回傳 404/null；新增遠端 repository 負向測試。
- Web 48 tests、Web typecheck 通過；API revision `tiancinge-web-recycle-guard-20260920` 已先以 tag smoke，再切換 100% 流量，前一版 `tiancinge-web-cursor20260920` 保留作回退。匿名回收列表／操作維持 HTTP 401／403。
- sitemap worker revision `tiancinge-sitemap-recycle-guard-20260920` 已切換 100% 流量，source archive 為 `gs://tiancinge_asia-east1_cloudbuild/static-site/source-f81139f733626b3cd78f238123488323ab9f48be5ebbc8e9c216d1d0a88cec1b.tar.gz`（generation `1789882234106162`）；未授權 `/status` 與 `/events` 回 HTTP 403。

## 追加發布（favicon 與瀏覽器資源錯誤修正，2026-09-20）

- 原因：正式站首頁以瀏覽器實際載入檢查時，唯一 404 是未宣告 favicon 導致的 `/favicon.ico` 請求。
- 修正：`apps/web/src/app/layout.tsx` 加入既有圓形 Logo 的 `icon` 與 `apple-touch-icon` metadata，避免瀏覽器回退請求不存在的 `/favicon.ico`。
- Web 靜態建置：17 個 sitemap URL、canonical/title/description/main 驗證通過；snapshot digest `e27bd95b14a74f5ecadb8dbeae991a080c6e3a827ffeba0101c5ff486d2cc3ac`。
- Cloud Build：`864ae2e7-6833-42c7-a96d-a00d9f963494`，SUCCESS（完成時間 `2026-09-20T06:18:33.843786Z`）。
- Hosting version：`sites/tiancinge-web/versions/6a41101ef0db7dd4`；release：`sites/tiancinge-web/releases/1789885117455000`。
- sitemap worker：`tiancinge-sitemap-favicon-20260920` 已接手 100% traffic；source archive generation `1789884537197391`。
- Live 驗證：favicon asset HTTP 200 `image/webp`；首頁、服務、消息、部落格、政策頁均 HTTP 200，Chrome headless 載入沒有 console error 或 4xx response；`robots.txt` 與 `sitemap.xml` 仍為 HTTP 200 且 Content-Type 正確。

## 追加發布（TOTP 防重放，2026-09-20）

- API Cloud Build：`fdd8df9b-1ee6-4f2b-bf37-d5c8f679624b`，SUCCESS；映像 digest `sha256:9bcd065aae5c2c08f610d56d312387891d206703324f920478695d98a69919bc`。
- Cloud Run API revision：`tiancinge-web-totp-replay-20260920`，已先完成匿名 smoke 後切換 100% traffic；`tiancinge-web-cursor20260920` 保留作回退。
- 程式修正：TOTP counter 以 Firestore transaction 記錄並拒絕重複或較舊 counter；恢復碼維持一次性 transaction consume，重播回傳一般 `mfa_required`，不洩漏驗證細節。
- 回歸：Web 49 tests、Admin 11 tests、sitemap worker 28 tests、Web/Admin typecheck、SEO audit、sitemap verify、task-card verify 與 `git diff --check` 均通過。

## 最終回歸重跑（2026-09-20）

- Web Vitest：16 files、50 tests passed；Admin Vitest：5 files、14 tests passed；sitemap worker：28 tests passed。
- 靜態建置以正式 Firestore snapshot 重跑成功：4 篇文章、5 個服務、17 個 sitemap URL；Webpack export、TypeScript 與所有靜態頁產生成功。
- Playwright：13 passed、19 skipped；略過項目皆需要未提供的管理員測試資料或正式帳號，不是測試失敗。
- 本機 fixture 管理後台 E2E 另以 `VITE_ADMIN_AUTH_SERVER=false` 執行：21 tests passed，證據見 `admin-e2e-2026-09-20.md`；這不取代正式管理員帳號的 API／Storage E2E。
- 正式端點核對：公開首頁／服務／消息／部落格、`robots.txt`、`sitemap.xml` 均 200；admin domain 的匿名 services/messages/media/settings API 均 401。
- Storage 版本化演練：以非敏感暫存物件完成 v1/v2 generation、刪除目前版本、從舊 generation 復原及清理；證據見 [`2026-09-20-storage-versioning.md`](../../data-security/evidence/2026-09-20-storage-versioning.md)。

## 追加資料安全驗收（Firestore＋Storage 複合復原）

- 使用 READY backup `2790c873-7f47-46e0-a009-00bf41adc193` 還原至隔離 database `restore-composite-20260920`；operation 完成 100%，讀取 `articles=4`、`services=5`、`article_categories=7`、`media_assets=31`、`site_settings=1`、`contact_messages=17`、`admin_sessions=2`。
- 從復原資料庫解析出 8 筆 `media_assets.storagePath`／文章媒體引用，8/8 對應 Storage 物件均以 `gcloud storage objects describe` 讀取成功；演練只讀取正式 Storage metadata。
- 驗證後已停用隔離 database delete protection 並刪除；正式 `(default)` database 仍存在且維持 delete protection enabled。完整證據見 [`2026-09-20-firestore-storage-composite-restore.md`](../../data-security/evidence/2026-09-20-firestore-storage-composite-restore.md)。

## 追加發布（sitemap 列表頁 lastmod 與 Googlebot parity，2026-09-20）

- 程式修正：`apps/sitemap-worker/src/document.mjs` 以可見服務、已發布消息／部落格的 `contentUpdatedAt`、`updatedAt` 或 `publishedAt` 最新值產生服務列表、消息列表、部落格列表與分類列表的 `lastmod`；沒有可信日期時省略，不使用建置或請求時間。
- 驗證腳本修正：`scripts/verify-sitemap.py` 現在檢查 UTF-8 XML declaration、XML/plain-text MIME、`X-Robots-Tag`、robots 非 HTML，並比對一般 UA 與 `Googlebot` sitemap body SHA-256。
- sitemap worker：revision `tiancinge-sitemap-lastmod-20260920` 已切換 100% traffic，來源封存 `gs://tiancinge_asia-east1_cloudbuild/static-site/source-88363c01ba6c1ed53aa2efd8d4e5aad9baa2ef4d195f19958fbbdd6286b9133b.tar.gz`，generation `1789895121159450`。
- Cloud Build：`3a1ca1e2-6fb6-4259-888b-9b6a5cbca7a4`，SUCCESS；新靜態產物 sitemap SHA-256 `bdb47a5b0b0696a6eb2beef1173599f02fe691b34676c30a3ebda11e813f31e2`，17 URLs。
- Hosting live：version `sites/tiancinge-web/versions/2dcf6d2c5a764b54`、release `sites/tiancinge-web/releases/1789896109157000`；worker status `published`、sequence `26`。
- 正式驗證：一般 UA／`Googlebot` 均 HTTP 200、`application/xml; charset=utf-8`、2,104 bytes、相同 SHA-256 `bdb47a5b0b0696a6eb2beef1173599f02fe691b34676c30a3ebda11e813f31e2`；`python3 scripts/verify-sitemap.py` 驗證 17/17 URLs 通過。

## 追加品質稽核與後台提示（2026-09-20）

- `scripts/audit-indexability.mjs` 現在分開量測服務詳情 `<article>` 正文，不把「其他服務項目」相關卡片誤算成正文；最新 `pnpm seo:audit` 仍為 17 個 sitemap route 通過，但明確列出 5 個服務正文短於 120 字，以及 3 篇消息正文短於 120 字的內容警示。
- `SEO_AUDIT_TABLE=1 pnpm seo:audit` 現可額外輸出 `URL | HTTP | ROBOTS | CANONICAL | TITLE | H1 | RESULT` TSV，方便交付報告逐路由核對；本次 17 個 sitemap route 均為 `200 | indexable | self-canonical | pass`。
- 本次逐路由表格已保存為 [`route-audit-2026-09-20.tsv`](route-audit-2026-09-20.tsv)。
- 正式安全冒煙另見資料安全證據 [`2026-09-20-security-smoke-latest.md`](../../data-security/evidence/2026-09-20-security-smoke-latest.md)：公開站安全標頭、robots／sitemap MIME、Admin API 401 邊界與 `pnpm audit --prod` 均通過。
- 新版本發布後於 2026-09-20 18:47 使用 `ouyangtaisen@gmail.com` 在正確 Search Console property 受控重新提交 `sitemap.xml`；Google 顯示「已成功提交 Sitemap」，列表仍等待非同步處理，狀態尚未更新為可攝取。
- 稽核輸出現在會保留每個 route 的 H1 文字，並檢查跨頁重複 H1；本次 17 個 route 的 `duplicateH1s` 為空。
- 新增 `apps/admin/src/features/services/service-quality.ts` 與測試；上架服務若正文短於 120 字、摘要空白或服務圖片沒有替代文字，後台顯示非阻擋式 SEO 提醒，保存仍由店家決定，不會自動創作文案。
- Admin Vitest：5 個 test files、14 tests passed；Admin typecheck/build passed。
- Admin Hosting 已發布至 `https://tiancinge-admin.web.app`；live HTML HTTP 200，保留 `noindex,nofollow,noarchive`，正式 bundle 可找到「SEO 提醒」與服務圖片替代文字提醒字串。發布時 Firebase CLI 先因 ADC quota project 缺失回傳 403，設定 `GOOGLE_CLOUD_QUOTA_PROJECT=tiancinge` 後重試成功。

## 追加服務 SEO metadata 契約與發布（2026-09-20）

- 共用 `Service` contract 新增選填 `seoTitle`／`seoDescription`；Web data mapper、公開快照與服務詳情 `generateMetadata` 已同步支援 camelCase 與既有 snake_case 欄位，沒有填值時分別回退至服務名稱與服務介紹。
- Admin 服務編輯器新增「SEO 標題」與「SEO 描述」欄位，加入 160／300 字長度驗證；服務品質提示會在欄位空白時提醒，但不阻擋草稿保存。SEO 欄位變更會被視為實質內容變更，讓 sitemap `lastmod` 能反映真正的頁面更新。
- 回歸：Web 16 files／50 tests、Admin 5 files／14 tests、Web/Admin typecheck 與 Admin build 均通過；`pnpm test:sitemap` 28 tests passed，`pnpm seo:audit` 17 routes／0 errors。
- 靜態來源封存：`gs://tiancinge_asia-east1_cloudbuild/static-site/source-f7ad57c7f4cae1ddac0aa795dcd0ff45d4ec4ae2cee4bf63af62938fdc60105c.tar.gz`，generation `1789899234844959`。
- Cloud Build：`5e362f12-c51e-447b-9636-fb9660e5f4cd`，SUCCESS（完成時間 `2026-09-20T10:24:52.587453Z`）。
- sitemap worker revision `tiancinge-sitemap-seo-service-meta-20260920` 已切換 100% traffic；受保護 `/repair` 回傳 `202`，建置完成後 status 為 `published`、`count: 17`，snapshot digest `59455771fac59e9b8ff5fdd4abdab6e85ad0384fa8a884f0c5b95011b51abdd1`，Hosting release `sites/tiancinge-web/releases/1789899896110000`，version `sites/tiancinge-web/versions/d70980235b1d38ce`。
- Admin Hosting 已重新發布服務 SEO 欄位；live bundle `assets/index-DBvP6msl.js` 可讀到「SEO 標題」／「SEO 描述」與長度驗證字串，後台仍保留 `noindex,nofollow,noarchive`。
- 公開驗證：sitemap 仍為 17 個 HTTPS URL、HTTP 200、`application/xml; charset=utf-8`，一般 UA 與 Googlebot body SHA-256 均為 `bdb47a5b0b0696a6eb2beef1173599f02fe691b34676c30a3ebda11e813f31e2`；`python3 scripts/verify-sitemap.py` 通過。由於目前正式服務資料尚未填入自訂 SEO 欄位，公開 HTML 的現有 fallback metadata 保持不變。

## 追加發布（服務詳情欄位支援，2026-09-20 19:02）

- `Service` contract、管理後台驗證／表單、Firestore 公開快照與服務詳情頁新增選填欄位：服務流程、適用情境、注意事項、常見問題。欄位上限各 2,000 字，只有有內容時才輸出公開區塊；未確認的店家資料不會由程式自行創作。
- 服務品質提示會在上架服務缺少上述任一欄位時顯示非阻擋提醒；欄位變更會更新實質內容日期並由 sitemap 延續既有 lastmod 規則。
- 靜態快照：digest `28ae2da755482bc1bbde93eae152e5622fb0028cd6f7ee6563136c3c62696065`，4 篇文章、5 個服務，sitemap digest 維持 `bdb47a5b0b0696a6eb2beef1173599f02fe691b34676c30a3ebda11e813f31e2`、17 URLs。
- 公開 Hosting 發布佇列序號 `28`；worker status `published`，Hosting version `sites/tiancinge-web/versions/db6427684a407dcd`，release `sites/tiancinge-web/releases/1789902143925000`，previous version `sites/tiancinge-web/versions/d70980235b1d38ce`，elapsed `39754ms`。
- Admin Hosting 已重新發布，live bundle `/assets/index-dmTU7fyJ.js` 可找到「服務流程」「適用情境」「注意事項」「常見問題」與 SEO 欄位字串；後台仍保留 `noindex,nofollow,noarchive`。
- Live smoke：首頁、服務詳情、robots、sitemap、Admin 均 HTTP 200；sitemap `application/xml; charset=utf-8`、robots `text/plain; charset=utf-8`；公開頁仍有 HSTS、CSP Report-Only、X-Content-Type-Options；`python3 scripts/verify-sitemap.py` 17/17 通過，`pnpm seo:audit` 17 routes／0 errors。
- 本次回歸：Web 51 tests、Admin 14 tests、sitemap worker 28 tests、Web/Admin typecheck、Admin build、`pnpm tasks:verify` 與 `git diff --check` 通過。
- 後續自動發布來源已同步：source archive `gs://tiancinge_asia-east1_cloudbuild/static-site/source-fc32b3fb8e48d55a55a92dc81587e73eed7435512a8865b62ee9566d43aa031e.tar.gz`，generation `1789902445618456`；Cloud Run worker revision `tiancinge-sitemap-service-detail-fields-20260920` 已完成候選 smoke 並切換 100% traffic。此 revision 確保下一次 Firestore 內容事件會使用本次服務詳情欄位程式。

- GSC 19:17 唯讀回查：`/sitemap.xml` 仍顯示「無法讀取 Sitemap」、探索 0、影片 0，沒有額外 HTTP/XML 錯誤碼；未移除或重複提交，因網站端 17 URLs、XML MIME 與 Googlebot parity 均已通過。

## 19:31 服務詳情 helper 與正式版本同步

- Web 回歸：Web Vitest 17 files／53 tests、Admin Vitest 5 files／14 tests、sitemap worker 28 tests、Web typecheck、Admin typecheck、task-card verification 與 `git diff --check` 全部通過。
- 靜態建置以目前 Firestore 公開快照產出 17 個 indexable HTML 路由；snapshot digest `28ae2da755482bc1bbde93eae152e5622fb0028cd6f7ee6563136c3c62696065`，sitemap SHA-256 `bdb47a5b0b0696a6eb2beef1173599f02fe691b34676c30a3ebda11e813f31e2`，內容與上一個公開 sitemap 相同。
- Firebase Hosting 已發布 version `sites/tiancinge-web/versions/e0da0e7d679e23cb`、release `sites/tiancinge-web/releases/1789903607749000`；worker status 回報 `published`、`count: 17`、`elapsedMs: 6138`。
- 靜態來源已封存至 `gs://tiancinge_asia-east1_cloudbuild/static-site/source-a85e8833a0a1f71bb03c58441fabeb7ebf1e90852e7117c2a911e92992d036d1.tar.gz`，generation `1789903703689692`；worker revision `tiancinge-sitemap-service-detail-helper2-20260920` 已完成 tagged smoke 後切換 100% traffic。
- `SEO_AUDIT_TABLE=1 node scripts/audit-indexability.mjs` 對 sitemap 17 routes 全部回 HTTP 200、indexable、self-canonical、唯一 title／H1；仍保留 8 筆內容長度 warning，交由後續內容補強任務處理。
- 最新 `pnpm test:e2e`：13 passed、19 skipped（需管理員測試資料的案例依設定略過），所有公開站與手機版案例通過。
- `pnpm seo:baseline`（最新回歸）通過 13 個基準路由、17 個 sitemap URL；首頁、列表、詳情、privacy、terms、search、editorial 的 metadata/canonical、robots 與 404 負向案例均通過。

## 19:52 robots 搜尋頁規則同步

- 修正 `apps/sitemap-worker/src/document.mjs`：`/search` 已由 `Allow` 改為 `Disallow`。搜尋頁仍保留使用者可訪問與頁面 `noindex`，但不再消耗爬蟲預算於任意查詢字串；公開 landing pages 與 sitemap URL 不受影響。
- `scripts/verify-sitemap.py` 與 `scripts/check-seo-baseline.mjs` 已新增 `/search` 排除驗證；sitemap worker 28 tests、正式 sitemap 17/17、SEO baseline 9 routes 全部通過。
- Firebase Hosting 已發布 version `sites/tiancinge-web/versions/25abcd202eb42249`、release `sites/tiancinge-web/releases/1789905026919000`；sitemap 內容與 SHA-256 維持不變，worker status `published`、count `17`。
- source archive 更新為 `gs://tiancinge_asia-east1_cloudbuild/static-site/source-abf3b1f6f38435f21927ebb6316f330439be59b699216c9a8474dee748ef6143.tar.gz`，generation `1789905058162523`；worker revision `tiancinge-sitemap-robots-search-20260920` 已完成 tagged smoke 並切換 100% traffic。

## 20:34 作者／編輯欄位資料鏈與正式發布

- 修正 `authorName` 只存在型別與前端 schema、未完整穿過遠端資料與靜態發布鏈的缺口：Web remote mapper、公開 snapshot projection、Admin `ManagedArticle` 與文章編輯器現在都支援 `author_name`／`authorName`，並保留 160 字上限；文章品質提示會在已上架文章未填作者時提示使用網站編輯團隊 fallback。
- 新增回歸測試：作者欄位被視為實質內容變更、payload 會保留並截斷長度、公開 snapshot 會投影 `author_name`。Web 17 files／54 tests、Admin 5 files／14 tests、sitemap worker 28 tests、Web/Admin typecheck 全部通過。
- 靜態建置 snapshot digest `996c3062c73dd1ea12327898847994903a4ac87ee8146085ffeff9ef39705203`，4 篇文章、5 個服務、17 個 sitemap URL；sitemap digest 維持 `bdb47a5b0b0696a6eb2beef1173599f02fe691b34676c30a3ebda11e813f31e2`。
- Firebase CLI 已以 `ouyangtaisen@gmail.com` 完成重新登入；公開 Hosting 已發布 version `sites/tiancinge-web/versions/159c0571d7307e94`、release `sites/tiancinge-web/releases/1789907651160000`，Firestore `_sitemap/status` 回報 `published`、count `17`、elapsed `6309ms`、previous version `25abcd202eb42249`。
- 靜態來源封存為 `gs://tiancinge_asia-east1_cloudbuild/static-site/source-a1f4b8d3879c3375e2e6dba06e302b450cb97f7cbad67c60ec4467bf699f6f9b.tar.gz`，generation `1789907093201533`；worker revision `tiancinge-sitemap-00055-yeq` 已切換 100% traffic，環境鎖定此來源封存。
- 管理後台已重新發布至 `https://tiancinge-admin.web.app`，version `projects/tiancinge/sites/tiancinge-admin/versions/792a6cda6b24e7ac`、release `projects/tiancinge/sites/tiancinge-admin/channels/live/releases/1789907765489000`；作者／編輯欄位與品質提示已包含在正式 bundle。
- 正式回歸：`python3 scripts/verify-sitemap.py` 17/17 通過；`pnpm seo:audit` 17 routes、0 errors（保留 8 筆內容長度警示）；`pnpm seo:baseline` 13 基準路由與 17 sitemap URL 通過；`pnpm tasks:verify` 63 張任務卡通過。
- 發布後 live smoke：公開首頁、`sitemap.xml`、`robots.txt` 與 Admin Hosting 均 HTTP 200；`/blog/lob01tcsx5` 回傳 self-canonical 與作者欄位 HTML；Admin bundle `assets/index-JL494d3b.js` 含「作者／編輯名稱」欄位。
- 最後 E2E 回歸：`pnpm test:e2e` 13 passed、19 skipped；略過項目需要未提供的正式管理員測試資料，不是測試失敗；`pnpm audit --prod --audit-level=moderate` 無已知漏洞。
- 20:51 以正式 Hosting 重新產生 `seo-audit-2026-09-20.json` 與 `route-audit-2026-09-20.tsv`：17 個 sitemap route、0 errors、8 筆內容長度 warning；這些 warning 仍只代表店家文案待確認，不是技術索引錯誤。
- 20:53 重新量測正式站 iPhone 13／390px（每路由 3 次，未啟用網路節流）：首頁 LCP 508ms、CLS 0.0057、TBT 0；服務 416ms／0.0080／0；消息 472ms／0.0092／0；部落格 432ms／0.0083／0。完整結果見 [`mobile-performance-latest-2026-09-20.json`](mobile-performance-latest-2026-09-20.json)。
- 20:57 直接從正式 release 重驗 `sitemap.xml` 與 `robots.txt`：一般 UA／Googlebot 均 HTTP 200、MIME 正確、body 完全一致；sitemap 17 URLs，SHA-256 `bdb47a5b0b0696a6eb2beef1173599f02fe691b34676c30a3ebda11e813f31e2`。網站端沒有可重現的 Sitemap 下載或格式錯誤。

## 20:49 GSC 唯讀回查

- 正確 URL-prefix property 的 Sitemap 報表仍顯示 `/sitemap.xml`「無法擷取」、探索網頁 `0`、影片 `0`；沒有 HTTP／XML／MIME 錯誤碼。
- 本次只讀取，不重複提交；網站端最新版本與 17 URL sitemap 已通過所有本地與正式端點驗證，剩餘差異屬 Google 外部非同步處理。
