# S12｜回收流程與稽核事件

狀態：程式實作完成；正式資料的回收／復原演練待維運者執行。

刪除先寫 `deletedAt/deletedBy`，列表預設排除回收項目；後台列表、公開 repository 與靜態建置都會排除回收項目。建立不可由一般管理 API 修改的 audit collection，記錄 actor、time、action、resource、result、requestId，禁止記錄 body/secret。永久清除需依保存政策在隔離流程執行。

## 本次交付

- `apps/web/src/features/admin-content/deletion.ts` 提供 legacy 欄位相容的回收判斷與操作者標記。
- 文章、服務、分類、素材與留言 DELETE API 改為更新 `deletedAt/deletedBy`，不立即刪除 Firestore 或 Storage 物件。
- 後台列表、公開 repository、sitemap worker 皆排除已回收資料。
- 新增 `POST /api/admin/recycle` 受保護操作：`restore` 可復原回收資料；`purge` 必須帶 `confirm: "PURGE"` 才能永久清除，素材會同步刪除 Storage 物件；兩者都寫入稽核事件。

## 尚未完成

- 尚未在正式資料執行復原或保存期滿永久清除演練；需先由維運者確認保存期限與核准人。正式未登入 smoke 已確認此入口回 403。
