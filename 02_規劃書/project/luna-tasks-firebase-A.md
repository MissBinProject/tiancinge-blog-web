# Firebase Luna 任務卡 A：基礎與安全

> 歷史版本：本卡組以 Firebase Auth、`admins/{uid}` 與前端 SDK 權限為前提。現行正式登入及管理 API 改由 Cloud Run server account 處理，請以 `update/data-security/luna-tasks/` 為準。

每張卡只處理一個責任範圍；Luna 執行時不可改動其他卡的檔案。所有卡完成後在「交接紀錄」補上命令、結果、URL／截圖、提交 SHA 與已知限制。

## FB-A01 固定 Firebase 環境契約與 fixture

- 參考圖：`03_UI設計圖/asset-map.md`；目標：固定 project、region、環境變數名稱及本機 fixture 邊界。
- 前置任務：無。可修改：`README.md`、`.env.example`、`packages/contracts/src/fixtures.ts`、規劃文件。
- 固定契約：project=`tiancinge`、region=`asia-east1`；前台使用 `FIREBASE_*`，後台使用 `VITE_FIREBASE_*`；未設定 Firebase 才能使用 fixture。
- 步驟：列出必要變數 → 補上 example（不得寫 secret）→ 確認 fixture 與正式資料欄位一致 → 執行型別檢查。
- 驗收：example 可複製、缺少變數時可啟動開發模式、正式模式不以 fixture 掩蓋讀取錯誤。
- 交接紀錄：已完成；證據：`README.md`、`apps/web/.env.example`、`apps/admin/.env.example`；命令與 SHA 於 `luna-tasks/commit-map.md` 補記。

## FB-A02 建立 Firestore collections 與 indexes

- 參考圖：`02_規劃書/project/firebase-data-api-plan.md`；目標：建立設定、服務、分類、文章、素材、留言及保護用 collection 契約。
- 前置任務：FB-A01。可修改：`firestore.rules`、`firestore.indexes.json`、`apps/web/scripts/seed-firebase.ts`。
- 固定契約：collection 名稱固定為 `site_settings`、`services`、`article_categories`、`articles`、`media_assets`、`contact_messages`；設定文件 ID=`singleton`。
- 步驟：建立規則與 index 檔 → 寫入可重跑 seed → 以 Firebase CLI 部署 → 讀回筆數與欄位。
- 驗收：空專案可建立 schema；seed 可重複執行且不產生重複設定；公開讀取所需排序不依賴未部署的複合 index。
- 交接紀錄：已完成；`tiancinge` Firestore Native Standard 位於 `asia-east1`，seed 筆數見 `firebase-deployment.md`。

## FB-A03 建立 Auth 管理員白名單

- 參考圖：`02_規劃書/project/technical-plan.md`；目標：單一 Firebase Email/Password 管理員與 `admins/{uid}` allowlist。
- 前置任務：FB-A02。可修改：`apps/admin/src/auth.ts`、`firestore.rules`、Auth／部署文件；不可提交密碼。
- 固定契約：只接受 Authentication user 且 `admins/{uid}.active !== false`；關閉公開註冊；Storage 上傳另需受信任 Admin SDK 設定 `admin=true` custom claim；匿名與非管理員不可讀寫管理 collections。
- 步驟：啟用 Email/Password → 建立管理員 → 寫入 allowlist → 實作登入、登出、重設及 session 檢查 → 驗證匿名／非管理員拒絕。
- 驗收：管理員可登入；失去 allowlist 時被登出；重設密碼流程可用；Rules 回傳 permission-denied。
- 交接紀錄：已完成；管理員為 `ouyangtaisen@gmail.com`，UID 僅記錄於 Firebase，不把密碼寫入文件。

## FB-A04 建立 Storage Rules 與檔案限制

- 參考圖：`03_UI設計圖/asset-map.md`；目標：讓後台可上傳／替換圖片，並阻擋不合規檔案。
- 前置任務：FB-A03。可修改：`storage.rules`、`apps/admin/src/repositories.ts`、素材文件。
- 固定契約：路徑前綴 `site-media/`；公開讀取；只有 `request.auth.token.admin == true` 的管理員可寫入／刪除；MIME 僅 JPEG、PNG、WebP；單檔 ≤10 MB。
- 步驟：建立 Storage bucket → 寫 Rules → 實作前端 MIME／大小檢查與下載 URL → 測試合法、超大及錯誤 MIME。
- 驗收：合法圖片可上傳並可預覽；非法檔案在 UI 與 Rules 都被拒絕；未登入或沒有 custom claim 不可寫入。
- 交接紀錄：已完成；bucket=`tiancinge.firebasestorage.app`、region=`asia-east1`，Rules 已發布。

## FB-A05 建立 API 錯誤與 token 邊界

- 參考圖：`02_規劃書/project/firebase-data-api-plan.md`；目標：定義 Cloud Run API 的錯誤格式、輸入上限與 server-only Firebase Admin 邊界。
- 前置任務：FB-A03。可修改：`apps/web/src/app/api/contact/route.ts`、`apps/web/src/lib/firebase-admin.ts`、測試。
- 固定契約：錯誤回應為 JSON `{error:string}`；缺欄位 400、超量 413、頻率 429、服務錯誤 503；瀏覽器不得取得 service account credential。
- 步驟：加入 JSON／byte 上限 → 驗證欄位與 URL → 封裝 Admin SDK → 建立 400／429／503 測試 → 記錄 request ID（不得含個資）。
- 驗收：空資料 400；超過限制拒絕；錯誤保留表單輸入；API route 可在 Cloud Run 啟動。
- 交接紀錄：已完成；`POST /api/contact` 公開 smoke test 空資料回 HTTP 400。

## FB-A06 建立 10 碼代碼產生器

- 參考圖：`02_規劃書/project/data-api-plan.md`；目標：服務與文章建立時自動產生固定的 10 位亂碼 URL code。
- 前置任務：FB-A02。可修改：`packages/contracts/src/index.ts`、fixture、repository 與測試。
- 固定契約：正則 `/^[a-z0-9]{10}$/`；建立後只讀不可手動修改；舊值不自動變更；碰撞時重新產生。
- 步驟：使用 Web Crypto／Node crypto → 實作 `createContentCode`／`isContentCode` → 新增資料時套用 → 將 fixture／seed 統一成 10 碼 → 加入格式測試。
- 驗收：新增服務／文章不需要 slug 輸入；列表、詳情與 sitemap 使用同一 code；所有 fixture code 通過 validator。
- 交接紀錄：已完成；公開服務、消息、部落格 code 已同步 fixture、Firestore 與 Playwright 路徑。
