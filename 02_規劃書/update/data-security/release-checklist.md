# 資料安全發布清單

1. 建立獨立 staging revision，固定 image digest，確認 runtime service account 與 secret 綁定。
2. 執行 Web/Admin typecheck、單元測試、建置、公開頁 SSR 冒煙、登入與管理 API 401/200 測試。
3. 檢查 Cloud Logging：無 token、密碼、留言正文、TOTP secret、恢復碼。
4. 驗證 Firestore backup schedule、delete protection、Storage soft delete 與 Firebase rules。
5. 以小比例流量部署，觀察 15 分鐘 5xx、403、延遲、記憶體與權限錯誤。
6. 驗證 sitemap/robots、canonical、文章/服務詳情頁未輸出未發布資料。
7. 保留上一個可回滾 revision；若錯誤率或權限錯誤上升，立即切回並建立事故紀錄。
8. 發布後 24 小時檢查備份第一次產生、登入、上傳、留言與後台載入。
