# S05｜加入 TOTP 雙重驗證

## 目標

單一管理員登入在密碼正確後必須再驗證 RFC 6238 TOTP。

## 範圍

只修改 `apps/web/src/features/admin-auth` 與登入 route/client；不要改公開網站或直接刪除現有帳號資料。

## 驗收

- 首次設定需一次性 enrollment，secret 只以 HTTPS 後台流程傳遞並加密保存。
- TOTP 驗證支援時間偏移 ±1 step，拒絕重播與錯誤碼不洩漏帳號存在與否。
- secret、token、驗證碼不進 log、URL、localStorage、錯誤回應。
- 新增單元測試與 `pnpm --filter @tian-xin-ge/web typecheck`。

## 目前交付

- TOTP 驗證器挑戰、±1 step 驗證與 Firestore transaction counter 防重播已在登入 API 實作。
- 可用 `pnpm admin:mfa:enrollment /secure/path/enrollment.json tiancinge` 產生一次性本機交接檔；工具會以 0600 權限寫入，且不會自動把 secret 或恢復碼送入雲端。
- 正式操作仍須由具權限的維運者將 TOTP secret 放入 Secret Manager、將恢復碼雜湊寫入 Firestore，先在管理員裝置完成註冊，再以錯誤／重播／時鐘偏移案例驗收後才開啟強制 MFA。
