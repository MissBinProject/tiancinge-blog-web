# S11｜內容樂觀鎖

已完成：文章、服務以 body `version`，設定以 `If-Match` header 傳遞整數版本，伺服器以 Firestore transaction 條件更新，版本不符回 409；前端收到新版本後更新記憶體狀態，不覆蓋其他管理員的新內容。後續可補上雙請求競爭整合測試。
