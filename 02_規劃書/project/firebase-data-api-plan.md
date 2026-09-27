# Firestore 資料與 API 規格

## Collections

`site_settings/singleton`、`services`、`article_categories`、`articles`、`media_assets`、`contact_messages`、`admin_sessions`、`admin_login_guards`、`contact_guards`、`contact_duplicates`。

文章 `type` 僅 `news`／`blog`，`status` 僅 `draft`／`published`。公開 repository 只讀取 `published`；後台所有資料異動都經 Cloud Run `/api/admin/*`，由 server account session、CSRF token、來源檢查與欄位／版本驗證共同授權。瀏覽器不取得 Firebase Admin 憑證，也不直接讀寫 Firestore／Storage；Cloud Run 使用 Admin SDK 讀寫資料。

正文保存受限 Tiptap JSON，寫入前轉換成共用 `ArticleBodyBlock[]`；只允許 heading、paragraph、list、link、image，圖片必須為 HTTPS 或站內路徑，拒絕任意 HTML。

## API

- `POST /api/contact`：JSON body 16KB 內，姓名、電話、訊息必填；每 client 每分鐘最多 5 次，電話＋訊息 30 秒內不得重複。
- 後台透過同源 Cloud Run API 讀寫 collections；列表搜尋與分頁在 adapter／畫面層完成，API 仍會在伺服器重新驗證欄位、來源、版本及內容引用。
- 批次操作沿用 `GET/POST/PATCH/DELETE /api/admin/*` 的 server account session；slug collision、設定／文章／服務版本衝突以 Firestore transaction 處理。
- 錯誤固定回傳 `code`、`message`；未登入 401、非管理員 403、版本衝突 409、格式錯誤 400。

## Indexes and security

目前資料量採 Cloud Run 讀取後排序，Firestore 不依賴複合 index；資料成長後再建立 `status + type + publishedAt desc` 與 `createdAt desc` index。Firestore Rules 拒絕瀏覽器直接讀寫，Storage Rules 僅允許 `site-media` 公開讀取，寫入／刪除一律由 Cloud Run Admin SDK 執行。新增或停用管理員時，輪替 Cloud Run 的密碼 secret 與 `ADMIN_CREDENTIAL_VERSION`，再撤銷既有 session。
