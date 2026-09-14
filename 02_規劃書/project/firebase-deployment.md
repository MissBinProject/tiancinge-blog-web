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
- 公開 smoke test：首頁、服務、最新消息、部落格與直接 Cloud Run URL 均 HTTP 200；`POST /api/contact` 空資料 HTTP 400。
- Firebase smoke test：管理員 custom claim 驗證、Firestore 服務新增／讀取／更新／刪除、Storage 合法圖片上傳／下載／刪除及 Contact API 成功寫入後清理均通過。
- 管理員 `ouyangtaisen@gmail.com` 已建立 Authentication user 與 `admins/{uid}` allowlist；首次使用請按「忘記密碼」。
- 程式提交：`9f61c45`（feat: deploy dynamic firebase website and admin）；規劃／Rules／測試同步提交：`c79c4e5`。

## 待完成

- 上傳原始圖片至 Storage，將 fixture 站內路徑替換成正式素材 URL。
- 完成驗收站登入、CRUD、規則越權測試、備份與自有網域 DNS。
- 建立 Cloud Scheduler／Budget 通知與 Firestore export/import 回復演練。

新增或停用管理員時，先以 Firebase Admin SDK 同步 `admin=true` custom claim，再建立／更新 `admins/{uid}` 文件；停用時先撤銷 claim，再將 allowlist 設為 `active:false`。

## 必要環境變數

Cloud Run：`FIREBASE_PROJECT_ID`、`FIREBASE_STORAGE_BUCKET`、`NEXT_PUBLIC_SITE_URL`。後台 build：`VITE_WEB_URL`、`VITE_FIREBASE_API_KEY`、`VITE_FIREBASE_AUTH_DOMAIN`、`VITE_FIREBASE_PROJECT_ID`、`VITE_FIREBASE_STORAGE_BUCKET`、`VITE_FIREBASE_APP_ID`。私密憑證使用 Cloud Run service identity 或 Secret Manager，不提交 `.env`。
