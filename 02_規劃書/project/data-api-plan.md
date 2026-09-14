# 資料與 API 計畫

## 資料界線（Firestore）

| 模組 | 公開讀取 | 管理員讀寫 | 主要規則 |
|---|---|---|---|
| `site_settings` | 是 | 是 | 單店只保留一筆；品牌、區塊文案、聯絡、SEO、政策、消息特色列與價格信任列 |
| `services` | `isVisible = true` | 是 | `slug` 為 10 位亂碼；`sortOrder` 控制首頁／價格順序；`price` 與 `priceLabel` 互斥 |
| `article_categories` | 只回傳至少有一篇已發布文章的分類 | 是 | `type` 只能是 `news`／`blog`；被文章使用時不可刪除 |
| `articles` | `status = published` | 是 | `slug` 為 10 位亂碼；分類名稱與 type 一致；正文為受限 JSON block |
| `media_assets` | 透過公開 Storage URL | 是 | MIME 僅 JPEG／PNG／WebP、10 MB；被任何內容引用時不可刪除 |
| `contact_messages` | 否 | 是 | 訪客只能呼叫 API；狀態為 `unread`／`handled` |

Firestore Rules 與 Storage Rules 均以 Firebase Authentication UID 對應 `admins/{uid}` 判定權限；公開查詢不依賴後台畫面攔截。Cloud Run 使用 Firebase Admin ADC 讀取公開內容並繞過客戶端 Rules。

## 公開 repository

| 操作 | 輸入 | 輸出 |
|---|---|---|
| `loadSettings()` | 無 | 一筆 `SiteSettings`；只有完全未設定 Firebase 的本機模式回 fixture，正式連線無資料或查詢錯誤會交給 error boundary |
| `loadServices()` | 無 | 依 `sortOrder` 排序的可見 `Service[]` |
| `loadArticles(type?)` | `news`／`blog`（選填） | 依 `publishedAt` 倒序的已發布 `Article[]` |
| `loadService(slug)`／`loadArticle(type, slug)` | slug | 找不到或未發布回 404 |

公開頁面以伺服器端 repository 取資料；不把 Firestore query 寫在畫面元件內。第一版使用 `force-dynamic`，後台儲存後重新整理即可看到更新。Fixture 只在完全沒有 Firebase 環境變數的本機開發模式使用；正式連線發生讀取錯誤或缺少必要品牌／聯絡欄位時 repository 會拋出錯誤交給公開 error boundary，避免把測試電話、地址或文章誤顯示給訪客。

## `POST /api/contact`

請求 `Content-Type: application/json`：

```json
{
  "name": "訪客姓名",
  "phone": "0912-345-678",
  "email": "visitor@example.com",
  "message": "想詢問精油按摩"
}
```

`name`、`phone`、`message` 必填；Email 選填。伺服器會先檢查 JSON body 大小，再驗證欄位長度與 Email 格式。正式 Firebase 模式以 Firestore transaction 寫入 `contact_guards` 與 `contact_duplicates`，以請求來源每分鐘最多五次提交，並以 `phone + message` digest 做 30 秒防重送；完全未設定 Firebase 的本機 fixture 才使用記憶體 fallback。正式環境由 server-only Firebase Admin SDK 寫入 `contact_messages`；瀏覽器永遠不取得服務帳號憑證。

| 狀態 | 回應 body | 條件 |
|---:|---|---|
| 200 | `{ "ok": true }` | 已成功寫入 |
| 400 | `{ "error": "..." }` | JSON、必填、格式或欄位長度錯誤 |
| 413 | `{ "error": "提交內容過大" }` | body 超過 16 KB |
| 429 | `{ "error": "..." }` | 頻率或重複提交限制 |
| 503 | `{ "error": "..." }` | 正式資料服務尚未設定或寫入失敗 |

## 管理 repository

`apps/admin/src/repositories.ts` 提供 settings／services／articles／categories／media／messages 的 list、upsert、update、delete adapter。畫面只傳遞 domain contract；Firestore 欄位映射、Storage 上傳／刪除及錯誤轉換集中在 adapter。未設定 `VITE_FIREBASE_*` 時使用 localStorage fixture 讓 Luna 可以獨立驗收畫面，該模式不代表正式資料同步。

## 正文與素材安全

- 正文只接受 `heading`、`paragraph`、`list`、`link`、`image`，最多 100 個 block；每個清單最多 100 個項目。
- link 只允許 `https://`、`mailto:`、`tel:`、站內 `/` 或 `#`；image 只允許 `https://` 或站內 `/`，拒絕 `javascript:`、`data:`、`vbscript:`。
- Storage policy 與前端 validator 同時限制 MIME 及 10 MB；資料庫保存寬高、替代文字及 storage path。
- 服務圖片、文章封面及網站設定圖片由 repository 與 Storage Rules 雙重限制為 HTTPS 或站內路徑；LINE 連結與地圖 Embed URL 只接受 HTTPS。
- 刪除前由 repository 讀取服務、文章及設定引用，檢查服務圖片、文章封面／正文圖片及網站設定引用。
