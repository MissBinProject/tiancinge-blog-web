# Firebase Luna 任務卡 D：動態官網與部署

> 歷史版本：本卡組保留早期部署交接。現行 revision、IAM、Rules、備份與回退證據請以 `firebase-deployment.md` 及 `update/data-security/evidence/` 為準。

官網使用 Next.js App Router 動態 SSR；Firebase Hosting 只作 TLS、CDN 與 rewrite。每卡只處理一個頁面資料邊界或一項部署能力。

## FB-D01 Next.js Firebase Admin data adapter

- 參考圖：`firebase-dynamic-plan.md`；目標：在 Cloud Run server 端以 Firebase Admin SDK 讀 Firestore。
- 前置任務：FB-B01；可修改：`apps/web/src/lib/firebase-admin.ts`、`apps/web/src/lib/data.ts`。
- 固定契約：Admin SDK 只在 server code；正式資料讀取失敗交給 error boundary；未配置環境才可 fixture fallback；禁止 Supabase import。
- 步驟：以 ADC 初始化 → 建立 Firestore／Storage accessor → mapper camelCase／snake_case → 封裝 settings／services／articles query → 加 `force-dynamic`。
- 驗收：Cloud Run 可啟動；伺服器不把憑證送到瀏覽器；正式資料與 fixture 邊界清楚。
- 交接紀錄：已完成；Cloud Run revision `tiancinge-web-00005-mhs` 已運行。

## FB-D02 動態設定與服務頁

- 參考圖：`首頁_01.png`、`首頁_02.png`；目標：首頁、服務列表／詳情與價格區直接讀 Firestore 最新值。
- 前置任務：FB-D01、FB-B02；可修改：Next.js page／section components、metadata。
- 固定契約：服務與價格共用同一 repository；價格空值顯示洽詢；隱藏服務不公開；LINE CTA 使用設定值。
- 步驟：接 loadSettings／loadServices → 依 code 建詳情 → 接 hero／services／pricing → 加 404 與 error boundary → 測試保存後刷新。
- 驗收：後台改價格後重新整理首頁與詳情同步；不存在／隱藏 code 回 404；桌機與手機無溢出。
- 交接紀錄：已完成；`/`、`/services`、`/services/{10碼}` 公開 smoke test 通過。

## FB-D03 動態消息與部落格詳情

- 參考圖：`首頁_03.png`、`首頁_04.png`；目標：消息／部落格列表、分類與文章詳情。
- 前置任務：FB-D01、FB-B04、FB-B05；可修改：`apps/web/src/app/news`、`blog`、共用 ArticleBody renderer。
- 固定契約：news／blog 分頁分離；公開只查 published；草稿、下架或不存在 code 回 404；正文只渲染安全 block。
- 步驟：建立列表 query → 分類與分頁 → 詳情 query → renderer → 404／空列表 → 以 draft fixture 驗證外洩防護。
- 驗收：消息與部落格內容不混；正文格式可重現；草稿不在 URL、搜尋或 sitemap。
- 交接紀錄：已完成；`/news`、`/blog` 與 10 碼詳情路徑公開回 HTTP 200，draft 回 404。

## FB-D04 動態搜尋、metadata、sitemap

- 參考圖：`ui-templates.md`；目標：搜尋已發布服務／文章，並提供 SEO metadata、canonical、sitemap、robots。
- 前置任務：FB-D02、FB-D03；可修改：`apps/web/src/app/search`、metadata、`sitemap.ts`、`robots.ts`。
- 固定契約：搜尋只回公開資料；每詳情 canonical 使用 10 碼 code；草稿不進 sitemap；網站設定提供 SEO title／description／OG。
- 步驟：實作 query parser → 過濾 title／excerpt → 建 metadata generator → 建 sitemap／robots → 驗證 draft 與危險 query。
- 驗收：無結果有畫面；metadata 與頁面標題一致；sitemap 不含草稿；搜尋不洩漏隱藏服務。
- 交接紀錄：已完成；公開 Playwright SEO、搜尋與 draft 限制通過。

## FB-D05 動態聯絡表單端到端

- 參考圖：`首頁_05.png`；目標：表單送到 Contact API，後台可查看留言。
- 前置任務：FB-B08、FB-C12；可修改：ContactSection、API route、Playwright test。
- 固定契約：成功清空並顯示狀態；失敗保留輸入；API 驗證、限流、防重送；留言不可由訪客讀取。
- 步驟：接 POST `/api/contact` → 顯示 loading／success／error → 以唯一測試資料送出 → 後台查詢 → 清除測試資料。
- 驗收：成功 API 建立一筆留言；錯誤不遺失輸入；後台狀態可更新；匿名 Firestore read 被拒。
- 交接紀錄：已完成；公開 Playwright 成功／失敗表單流程通過，空 JSON HTTP 400。

## FB-D06 Cloud Run Dockerfile 與健康檢查

- 參考圖：`firebase-deployment.md`；目標：建立可重現的 Next standalone container 與低成本執行設定。
- 前置任務：FB-D01～FB-D05；可修改：`Dockerfile`、`apps/web/Dockerfile`、`next.config.ts`、Cloud Build 設定。
- 固定契約：`output=standalone`；region=`asia-east1`；min instances=0、max instances=2；服務帳號走 ADC；不提交 env secret。
- 步驟：安裝依賴 → build standalone → 啟動 server → curl health／頁面 → 建 Cloud Build image → 部署 revision。
- 驗收：container 能啟動；公開頁與 API 可回應；閒置時不保留常駐 instance；revision 可回退。
- 交接紀錄：已完成；Cloud Build build `8a501f63-1810-4b37-abdf-059552af936d` SUCCESS。

## FB-D07 Firebase Hosting web rewrite

- 參考圖：`firebase-dynamic-plan.md`；目標：讓自有 web site 保有 Hosting URL，同時把動態路由導向 Cloud Run。
- 前置任務：FB-D06；可修改：`firebase.json`、`.firebaserc`、部署文件。
- 固定契約：site=`tiancinge-web`；所有 web request rewrite 至 Cloud Run `tiancinge-web`、`asia-east1`；不可改成靜態建置等待流程。
- 步驟：設定 hosting target → 加 rewrite region／service → `firebase deploy --only hosting: web` → 測試首頁、詳情、API、404。
- 驗收：Hosting URL 顯示動態 Firestore 資料；直接 Cloud Run 與 Hosting 結果一致；TLS 正常。
- 交接紀錄：已完成；`https://tiancinge-web.web.app` 已發布並 rewrite。

## FB-D08 後台 Hosting 部署

- 參考圖：後台樣板；目標：建置 Vite admin 並發布至獨立 Firebase Hosting site。
- 前置任務：FB-C01～FB-C13；可修改：`firebase.json`、admin build、部署文件。
- 固定契約：site=`tiancinge-admin`；public=`apps/admin/dist`；build-time `VITE_FIREBASE_*` 不含私密金鑰；所有路由 fallback 到 index.html。
- 步驟：注入 env → `pnpm build:admin` → `firebase deploy --only hosting:admin` → 驗證登入頁、路由與靜態資產。
- 驗收：後台可開啟；登入後列表／表單／編輯器可載入；重新整理子路徑不 404。
- 交接紀錄：已完成；`https://tiancinge-admin.web.app` 已發布。

## FB-D09 Firestore／Storage 越權測試

- 參考圖：`firebase-data-api-plan.md`；目標：以真實 Firebase client 驗證匿名、非管理員與管理員權限。
- 前置任務：FB-D07、FB-D08；可修改：Rules、測試腳本、驗收文件。
- 固定契約：匿名不可讀／寫管理 collections；非 admin 不可讀／寫；admin 可依表單契約讀寫；Storage 寫入／刪除需 `admin=true` custom claim。
- 步驟：匿名 client 讀取 → 非 admin token 讀寫 → admin token 讀寫 → 上傳合法／非法檔案 → 刪除使用中素材。
- 驗收：越權全部 permission-denied；管理員可完成允許操作；測試不留下臨時資料或憑證。
- 交接紀錄：匿名 Firestore 讀取已驗證被拒；完整 admin CRUD 與 Storage 演練需使用專用測試帳號執行。

## FB-D10 費用、日誌、備份與回退

- 參考圖：`firebase-deployment.md`；目標：建立近零固定成本設定、監控、備份與回退作業。
- 前置任務：FB-D07～FB-D09；可修改：部署文件、Budget／Cloud Logging／Firestore export 設定。
- 固定契約：Cloud Run min=0/max=2；Firestore／Storage 優先免費層；圖片 ≤10 MB；Budget 通知是警示；備份不得含密碼。
- 步驟：設定 Budget alert → 設定 Cloud Run log retention → 建 Firestore export／import → 開 Storage object versioning／lifecycle → 演練 Cloud Run revision rollback。
- 驗收：可查詢成本與錯誤日誌；備份能還原測試資料；回退後 URL 可服務；將演練日期與結果寫回文件。
- 交接紀錄：成本控制已設定 min=0/max=2；Firestore export／Storage 版本化備份與正式回復演練列為上線前待辦。
