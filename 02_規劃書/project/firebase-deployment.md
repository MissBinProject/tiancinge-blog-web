# tiancinge 部署紀錄與設定

## 2026-09-20 現行架構

- 公開網站使用 Firebase Hosting 靜態 HTML；Firebase Hosting 不再把公開路由轉給 Cloud Run catch-all。
- Cloud Run `tiancinge-web` 只承載管理 API、聯絡表單與發布協調；目前 revision 為 `tiancinge-web-totp-replay-20260920`，100% traffic。
- Cloud Run `tiancinge-sitemap` 讀取 Firestore 公開快照，產生完整 HTML、`robots.txt` 與 `sitemap.xml`，再透過受控 Hosting release 發布；目前 revision 為 `tiancinge-sitemap-00055-yeq`，100% traffic，已鎖定包含作者／編輯欄位投影的 source archive。
- 正式 Hosting version：`sites/tiancinge-web/versions/159c0571d7307e94`；release：`sites/tiancinge-web/releases/1789907651160000`。
- 靜態建置 source archive：`gs://tiancinge_asia-east1_cloudbuild/static-site/source-a1f4b8d3879c3375e2e6dba06e302b450cb97f7cbad67c60ec4467bf699f6f9b.tar.gz`，generation `1789907093201533`。
- API 回退 revision：`tiancinge-web-cursor20260920`；sitemap worker 回退 revision：`tiancinge-sitemap-recycle-guard-20260920`。

## 已完成

- GCP/Firebase project：`tiancinge`。
- Firebase Hosting sites：`tiancinge-web`、`tiancinge-admin`。
- Firestore Native Standard：`asia-east1`，免費層已啟用。
- Firebase Storage default bucket：`tiancinge.firebasestorage.app`，位置 `asia-east1`。
- Firebase Web App：`1:214942104752:web:81a5fcbda817bf70c48f75`。
- 管理後台不使用 Firebase Authentication；帳號密碼由 Cloud Run server account 驗證，session、CSRF 與管理 API 授權均在伺服器處理。
- Firestore Rules 對瀏覽器讀寫一律拒絕；Storage Rules 只允許 `site-media` 公開讀取，瀏覽器寫入／刪除一律拒絕，素材異動由 Cloud Run Admin SDK 且須通過管理員 session。
- Fixture 已匯入 Firestore：5 services、8 articles、23 media metadata、2 messages；服務與文章代碼已轉為 10 位亂碼。
- Cloud Run `tiancinge-web` 初期動態網站 revision `tiancinge-web-00032-c4p` 為歷史部署；目前公開頁已切換至 Firebase Hosting 靜態 release，Cloud Run 僅保留 API 與發布協調功能，現行 revision 見上方「2026-09-20 現行架構」。
- 後台 Vite build 已發布至 Firebase Hosting `tiancinge-admin`。
- 2026-09-20 20:36 已以 `ouyangtaisen@gmail.com` 完成 Firebase CLI re-auth；Admin Hosting 現行 release 為 `projects/tiancinge/sites/tiancinge-admin/channels/live/releases/1789907765489000`，包含作者／編輯名稱與 SEO 品質提示欄位。
- Firebase/GCP 帳務防護已設定（帳號 `ouyangtaisen@gmail.com`、帳單帳戶 `016915-3B65AD-1A05CA`）：Cloud Run 每月 NT$100、Gemini API 每月 NT$1、Vertex AI 每月 NT$1，皆為每月「強制執行支出上限」並限定 `tiancinge` 專案；達標後暫停指定服務的新用量。
- 公開 smoke test：首頁、服務、最新消息、部落格與直接 Cloud Run URL 均 HTTP 200；`POST /api/contact` 空資料 HTTP 400。
- Firebase／Cloud Run smoke test：未登入管理 API 回 401、Firestore／Storage 瀏覽器直寫遭 Rules 拒絕、管理員 API 的 CRUD／素材處理與 Contact API 驗證通過。
- 管理員登入帳號為 `tiancinge`；密碼雜湊只放在 Cloud Run Secret Manager 的 `ADMIN_PASSWORD_HASH`，不寫入前端、Git 或文件。密碼重設由維護者以受控流程輪替 secret。
- 程式提交：`9f61c45`（feat: deploy dynamic firebase website and admin）；規劃／Rules／測試同步提交：`c79c4e5`。

## 仍待完成

- 管理員註冊並啟用 TOTP secret、建立恢復碼，並完成真實登入／復原演練。
- 完成 CSP enforce 前的 24 小時正式來源觀察。
- 完成正式自有網域 DNS 與 Hosting 緊急下架演練。

## 帳務防護

2026-09-15 已在 Google Cloud Console 的「預算與警告」建立下列每月支出上限（幣別為 TWD）：

| 預算 | 專案 | 服務 | 上限 | Console budget ID |
| --- | --- | --- | ---: | --- |
| 天心閣cloudrun | `tiancinge` | Cloud Run (`run.googleapis.com`) | NT$100 | `cd08a90c-6b04-400e-9043-564795cb41ce` |
| 天心閣 AI 服務每月上限 NT$1 | `tiancinge` | Gemini API (`generativelanguage.googleapis.com`) | NT$1 | `f6ec97c1-7586-469b-bccb-f3e00d962da8` |
| 天心閣 Vertex AI 每月上限 NT$1 | `tiancinge` | Vertex AI (`aiplatform.googleapis.com`) | NT$1 | `0dc2721c-6fe2-403d-8a3f-dffc9ce62edb` |

這些是 Google Cloud Billing 的 Preview「支出上限」，不是只有寄信的警告預算。達到上限時會暫停該服務的新用量，既有資源與資料不會刪除；解除或提高上限需由帳單管理員在 Console 手動操作。支出回報及強制執行可能延遲，無法保證精確停在指定金額，因此 Cloud Run 應用仍需避免無限重試與突發流量。

管理入口：<https://console.cloud.google.com/billing/016915-3B65AD-1A05CA/budgets?project=tiancinge>

注意：目前 `gcloud beta billing budgets list` 只會列出傳統警告預算，Console 建立的 Preview 支出上限以管理入口的清單為準。若未來新增其他 AI 服務，先確認它是否出現在支出上限的「服務」清單；每一個服務需建立獨立的 NT$1 上限。

新增或停用管理員時，先輪替 Cloud Run 的帳號／密碼 secret 與 `ADMIN_CREDENTIAL_VERSION`，再撤銷所有既有 session；目前設計為單一管理員帳號，不建立瀏覽器可讀的管理員文件。

## 必要環境變數

Cloud Run：`FIREBASE_PROJECT_ID`、`FIREBASE_STORAGE_BUCKET`、`NEXT_PUBLIC_SITE_URL`、`ADMIN_USERNAME`、`ADMIN_CREDENTIAL_VERSION`、`ADMIN_ALLOWED_ORIGIN`，以及由 Secret Manager 注入的 `ADMIN_PASSWORD_HASH`（註冊 MFA 後另加 `ADMIN_TOTP_SECRET`）。後台 build：`VITE_WEB_URL`、`VITE_ADMIN_AUTH_SERVER=true`；Firebase Web App 的公開設定只在確有使用 Firebase SDK 時才需要。私密憑證使用 Cloud Run service identity 或 Secret Manager，不提交 `.env`。
