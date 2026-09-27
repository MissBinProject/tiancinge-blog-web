# 2026-09-20 正式安全與標頭冒煙驗證

## 範圍

以正式 Firebase Hosting 公開站與 Admin Hosting 端點驗證本次 SEO／靜態發布後的安全標頭、HTTPS、robots、sitemap 與匿名管理 API 邊界。這是即時冒煙檢查，不取代 TOTP 註冊、CSP 長時間觀察或正式回退演練。

## 公開站結果

下列路徑均回 HTTP 200、HTTPS、HSTS、`X-Content-Type-Options: nosniff`、`X-Frame-Options: SAMEORIGIN`、`Referrer-Policy` 與 `Permissions-Policy`：

```text
/
/services/7usx1gzbua
/blog/lob01tcsx5
/robots.txt
/sitemap.xml
/privacy
/terms
```

內容類型符合預期：

```text
/robots.txt   text/plain; charset=utf-8
/sitemap.xml  application/xml; charset=utf-8
```

公開站目前提供 `Content-Security-Policy-Report-Only`，尚未切換為 enforce；這是刻意保留的觀察階段。

## Admin API 結果

未攜帶管理員 session 的請求均被拒絕：

```text
401 /api/admin/services
401 /api/admin/messages
401 /api/admin/media
401 /api/admin/settings
```

## 依賴掃描

```text
pnpm audit --prod --audit-level=moderate
No known vulnerabilities found
```

## 結論

本次正式端點沒有發現標頭退化、錯誤 MIME、匿名管理 API 暴露或已知 production 依賴漏洞。TOTP／恢復碼正式註冊、CSP 24 小時觀察與 Hosting 緊急回退仍須依營運驗收流程完成。

## 服務詳情欄位發布後重跑（2026-09-20 19:12）

- 公開 Hosting `/`、`/services/7usx1gzbua`、`/sitemap.xml`、`/robots.txt` 均 HTTP 200；HSTS、CSP Report-Only、`X-Frame-Options`、`X-Content-Type-Options`、`Referrer-Policy` 與 `Permissions-Policy` 均存在。
- MIME 維持：`sitemap.xml` 為 `application/xml; charset=utf-8`，`robots.txt` 為 `text/plain; charset=utf-8`。
- Cloud Run API `https://tiancinge-web-uuwy2dpmdq-de.a.run.app` 的匿名 `/api/admin/services`、`messages`、`media`、`settings` 均回 HTTP 401；不要以 Firebase Hosting 404 取代 API 邊界驗證。
- `corepack pnpm audit --prod --audit-level=moderate`：No known vulnerabilities found。
- sitemap worker `tiancinge-sitemap-robots-search-20260920` 已使用新 source archive 並承接 100% traffic；本次變更沒有改動 API 權限邊界。

## 19:41 重新驗證

- Cloud Run API `https://tiancinge-web-uuwy2dpmdq-de.a.run.app` 的匿名 `/api/admin/services`、`/messages`、`/media`、`/settings` 仍全部回 HTTP 401。
- Firebase Hosting `/`、`/services/7usx1gzbua`、`/sitemap.xml`、`/robots.txt` 仍全部回 HTTP 200。
- `/usr/local/bin/corepack pnpm audit --prod --audit-level=moderate`：No known vulnerabilities found。

## 20:01 Cloud Logging 點驗（UTC 12:01）

- 讀取 `tiancinge-web` 與 `tiancinge-sitemap` 兩個 Cloud Run service 最近 24 小時的 `severity>=ERROR` 日誌，均沒有回傳錯誤事件。
- 目前承接流量的 revision：`tiancinge-web-totp-replay-20260920`、`tiancinge-sitemap-robots-search-20260920`。
- 這是時間點觀測結果，不能取代正式 24 小時驗收；仍需依營運流程完成 TOTP／恢復碼實際復原、CSP enforce 前觀察與 Hosting 回退演練。

## 20:16 Cloud Logging 重查（UTC 12:16）

- 再次查詢 `tiancinge-web` 與 `tiancinge-sitemap` 最近 24 小時的 Cloud Run `severity>=ERROR` 事件，兩個 service 均無輸出。
- 這筆重查只更新觀測證據，不把短時間無錯誤誤判為 24 小時正式驗收完成。

## 20:40 Cloud Logging 重查（UTC 12:40）

- Firebase CLI 已以 `ouyangtaisen@gmail.com` 完成 re-auth；作者／編輯欄位版本已發布至公開 Hosting，Admin Hosting 亦已更新。
- 再次查詢 `tiancinge-web` 與 `tiancinge-sitemap` 最近 24 小時的 Cloud Run `severity>=ERROR` 事件，兩個 service 均無輸出。
- 目前承接流量的 revision：`tiancinge-web-totp-replay-20260920`、`tiancinge-sitemap-00055-yeq`；worker source generation `1789907093201533`。
- 這筆重查只更新觀測證據，不把短時間無錯誤誤判為 24 小時正式驗收完成。
