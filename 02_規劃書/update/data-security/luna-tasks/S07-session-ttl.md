# S07｜Session TTL 與閒置撤銷

為 `admin_sessions` 加 `expiresAt` TTL 欄位與 Firestore TTL 設定，加入最後活動時間與閒置 timeout。驗收過期、閒置、登出、credential version 變更皆不能讀寫管理 API；確認 TTL 不依賴前端清理。
