# tiancinge 部署紀錄與設定

## 已完成

- GCP/Firebase project：`tiancinge`。
- Firebase Hosting sites：`tiancinge-web`、`tiancinge-admin`。
- Firestore Native Standard：`asia-east1`，免費層已啟用。
- Firebase Storage default bucket：`tiancinge.firebasestorage.app`，位置 `asia-east1`。
- Firebase Web App：`1:214942104752:web:81a5fcbda817bf70c48f75`。
- Email/Password Authentication 已啟用。
- Fixture 已匯入 Firestore：5 services、8 articles、23 media metadata、2 messages；服務與文章代碼已轉為 10 位亂碼。
- Cloud Run `tiancinge-web` 已部署 revision `tiancinge-web-00002-vnm`，Firebase Hosting rewrite 已發布。
- 後台 Vite build 已發布至 Firebase Hosting `tiancinge-admin`。
- 公開 smoke test：首頁、服務、最新消息、部落格與直接 Cloud Run URL 均 HTTP 200；`POST /api/contact` 空資料 HTTP 400。
- 管理員 `ouyangtaisen@gmail.com` 已建立 Authentication user 與 `admins/{uid}` allowlist；首次使用請按「忘記密碼」。

## 待完成

- 上傳原始圖片至 Storage，將 fixture 站內路徑替換成正式素材 URL。
- 完成驗收站登入、CRUD、規則越權測試、備份與自有網域 DNS。
- 建立 Cloud Scheduler／Budget 通知與 Firestore export/import 回復演練。

## 必要環境變數

Cloud Run：`FIREBASE_PROJECT_ID`、`FIREBASE_STORAGE_BUCKET`、`NEXT_PUBLIC_SITE_URL`。後台 build：`VITE_WEB_URL`、`VITE_FIREBASE_API_KEY`、`VITE_FIREBASE_AUTH_DOMAIN`、`VITE_FIREBASE_PROJECT_ID`、`VITE_FIREBASE_STORAGE_BUCKET`、`VITE_FIREBASE_APP_ID`。私密憑證使用 Cloud Run service identity 或 Secret Manager，不提交 `.env`。
