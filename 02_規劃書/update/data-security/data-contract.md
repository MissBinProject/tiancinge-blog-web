# 資料安全契約

## API body 上限

| 路徑群組 | 方法 | 上限 | 超限回應 |
| --- | --- | ---: | --- |
| `/api/admin/auth/login` | POST | 8 KiB | 413 `too_large` |
| `/api/admin/articles`、`/[id]` | POST/PATCH | 512 KiB | 413 `too_large` |
| 服務、分類、設定、留言、素材 metadata | POST/PATCH | 64 KiB | 413 `too_large` |
| `/api/contact` | POST | 16 KiB stream | 413 `too_large` |
| `/api/admin/media` multipart | POST | 10 MiB 圖片；總 request 上限 10 MiB + 64 KiB multipart overhead，單一檔案且 Sharp 解碼像素上限 40 MP | 413 `too_large` |

超限或非 JSON object 一律在 schema 驗證前回應，不回傳輸入內容。

## 敏感欄位處理

- session token、CSRF token、TOTP secret、恢復碼只可存在 HttpOnly cookie、伺服器記憶體或加密後資料庫欄位；不得進 localStorage、URL、React error、console 或 log。
- 留言姓名、電話、Email、內容與內部備註屬機密資料；瀏覽器只在已驗證 session 且頁面仍開啟時保存在記憶體。
- 未發布文章與設定不可透過公開 API、SSR HTML、sitemap 或錯誤頁輸出。

## 錯誤格式

```json
{
  "ok": false,
  "error": { "code": "too_large|invalid_request|unauthorized|conflict", "message": "給使用者的短訊息" }
}
```

錯誤訊息不得包含 stack trace、Firestore 路徑、secret 名稱、原始 body 或個資。

## 內容版本

文章與服務文件由伺服器維護整數 `version`。新增資料從 1 開始；更新時若 request body 帶有 `version`，必須與目前版本相同，成功後遞增 1，衝突回 409。`site_settings/singleton` 以 `If-Match` header 傳遞相同版本條件，伺服器 transaction 成功後遞增並回傳新版本。管理前端會把回應版本帶回記憶體，重新整理後再試，不以舊資料覆蓋新資料。
