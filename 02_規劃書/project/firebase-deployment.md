# tiancinge 部署紀錄與設定

## 已完成

- GCP/Firebase project：`tiancinge`。
- Firebase Hosting sites：`tiancinge-web`、`tiancinge-admin`。
- Firestore Native Standard：`asia-east1`，免費層已啟用。
- Firebase Storage default bucket：`tiancinge.firebasestorage.app`，位置 `asia-east1`。
- Firebase Web App：`1:214942104752:web:81a5fcbda817bf70c48f75`。
- Email/Password Authentication 已啟用。
- 管理員 Authentication custom claim `admin=true` 已設定，Storage Rules 以此 claim 保護上傳／刪除；Firestore Rules 另以 `admins/{uid}.active` allowlist 保護資料。
- Fixture 已匯入 Firestore：5 services、8 articles、23 media metadata、2 messages；服務與文章代碼已轉為 10 位亂碼。
- Cloud Run `tiancinge-web` 已部署 revision `tiancinge-web-00005-mhs`，Firebase Hosting rewrite 已發布。
- 後台 Vite build 已發布至 Firebase Hosting `tiancinge-admin`。
- Firebase/GCP 帳務防護已設定（帳號 `ouyangtaisen@gmail.com`、帳單帳戶 `016915-3B65AD-1A05CA`）：Cloud Run 每月 NT$100、Gemini API 每月 NT$1、Vertex AI 每月 NT$1，皆為每月「強制執行支出上限」並限定 `tiancinge` 專案；達標後暫停指定服務的新用量。
- 公開 smoke test：首頁、服務、最新消息、部落格與直接 Cloud Run URL 均 HTTP 200；`POST /api/contact` 空資料 HTTP 400。
- Firebase smoke test：管理員 custom claim 驗證、Firestore 服務新增／讀取／更新／刪除、Storage 合法圖片上傳／下載／刪除及 Contact API 成功寫入後清理均通過。
- 管理員登入帳號為 `tiancinge`；其 Firebase Authentication 恢復信箱為 `ouyangtaisen@gmail.com`，已建立 Authentication user 與 `admins/{uid}` allowlist；首次使用請按「忘記密碼」。
- 程式提交：`9f61c45`（feat: deploy dynamic firebase website and admin）；規劃／Rules／測試同步提交：`c79c4e5`。

## 待完成

- 上傳原始圖片至 Storage，將 fixture 站內路徑替換成正式素材 URL。
- 完成驗收站登入、CRUD、規則越權測試、備份與自有網域 DNS。
- 建立 Cloud Scheduler／Budget 通知與 Firestore export/import 回復演練。

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

新增或停用管理員時，先以 Firebase Admin SDK 同步 `admin=true` custom claim，再建立／更新 `admins/{uid}` 文件；停用時先撤銷 claim，再將 allowlist 設為 `active:false`。

## 必要環境變數

Cloud Run：`FIREBASE_PROJECT_ID`、`FIREBASE_STORAGE_BUCKET`、`NEXT_PUBLIC_SITE_URL`。後台 build：`VITE_WEB_URL`、`VITE_FIREBASE_API_KEY`、`VITE_FIREBASE_AUTH_DOMAIN`、`VITE_FIREBASE_PROJECT_ID`、`VITE_FIREBASE_STORAGE_BUCKET`、`VITE_FIREBASE_APP_ID`。私密憑證使用 Cloud Run service identity 或 Secret Manager，不提交 `.env`。
