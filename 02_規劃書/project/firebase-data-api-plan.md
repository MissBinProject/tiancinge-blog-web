# Firestore 資料與 API 規格

## Collections

`site_settings/singleton`、`services`、`article_categories`、`articles`、`media_assets`、`contact_messages`、`admins/{uid}`、`contact_guards`、`contact_duplicates`。

文章 `type` 僅 `news`／`blog`，`status` 僅 `draft`／`published`。公開 repository 只讀取 `published`；後台 repository 使用 Firebase Web SDK，Firestore／Storage Rules 驗證 Firebase ID token 及 `admins/{uid}.active`。需要 server-side 寫入的訪客留言只經 Cloud Run API。

正文保存受限 Tiptap JSON，寫入前轉換成共用 `ArticleBodyBlock[]`；只允許 heading、paragraph、list、link、image，圖片必須為 HTTPS 或站內路徑，拒絕任意 HTML。

## API

- `POST /api/contact`：JSON body 16KB 內，姓名、電話、訊息必填；每 client 每分鐘最多 5 次，電話＋訊息 30 秒內不得重複。
- 後台直接以 Firebase Web SDK 讀寫受 Rules 保護的 collections；列表搜尋與分頁在 adapter／畫面層完成，避免內容管理頁依賴額外 API。
- 若未來需要 server-side 批次操作，再新增 `GET/POST/PATCH/DELETE /api/admin/*`，驗證 ID token、欄位、版本及內容引用；slug collision 以 Firestore transaction 重試。
- 錯誤固定回傳 `code`、`message`；未登入 401、非管理員 403、版本衝突 409、格式錯誤 400。

## Indexes and security

目前資料量採 Cloud Run 讀取後排序，Firestore 不依賴複合 index；資料成長後再建立 `status + type + publishedAt desc` 與 `createdAt desc` index。Firestore Rules 及 Storage Rules 拒絕匿名直接讀寫，管理員文件只能由本人讀取；Cloud Run 使用 Admin SDK 後仍自行執行相同授權規則。
