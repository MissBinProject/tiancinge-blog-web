# Secret／日誌掃描（2026-09-20）

## 程式與工作區

- 使用 `rg` 掃描私鑰標記、Google API key、AWS access key、Slack/GitHub token 及常見秘密格式；未找到疑似秘密值。
- 以 `rg` 檢查 `ADMIN_PASSWORD_HASH`、`ADMIN_TOTP_SECRET`、`FIREBASE_PRIVATE_KEY`、`private_key` 引用；只出現在範例、設定名稱、驗收文件或程式讀取位置，沒有實際 secret 值。
- `pnpm audit --prod --audit-level=moderate`：`No known vulnerabilities found`。

## Cloud Logging

執行：

```sh
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="tiancinge-web" AND (textPayload:"password" OR textPayload:"token" OR textPayload:"secret" OR jsonPayload.message:"password" OR jsonPayload.message:"token" OR jsonPayload.message:"secret")' \
  --project=tiancinge --limit=20 --format='value(timestamp,resource.labels.revision_name,textPayload)'
```

結果：無輸出。掃描不包含秘密值本身，也不把登入資訊、留言正文或上傳內容寫入證據。

## 限制

此為目前工作區與最近 Cloud Run 日誌的抽樣掃描；套件升級、部署 log 與外部整合變更時仍需重跑相同檢查。
