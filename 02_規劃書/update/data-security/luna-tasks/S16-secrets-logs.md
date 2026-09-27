# S16｜秘密與日誌掃描

掃描 git history、目前檔案、Docker/Cloud Build 與 Cloud Logging，找出 password/hash/token、留言正文與 TOTP secret；移除或遮罩，必要時輪替 secret。新增不包含明碼的測試與 CI 檢查，禁止把真 secret 寫進 fixture 或文件。
