# A02 Search Console 外部結果追蹤

## 可由網站端證實的狀態

- 正式 sitemap：<https://tiancinge-web.web.app/sitemap.xml>
- 正式 robots：<https://tiancinge-web.web.app/robots.txt>
- 2026-09-20 發布後，sitemap HTTP 200、`application/xml; charset=utf-8`、17 個唯一 URL。
- 一般 UA 與自訂 Googlebot UA 回應相同；每個 sitemap URL 均通過 HTTP、canonical、H1、description 與 noindex 稽核。

## 2026-09-20 提交紀錄

- 使用具權限的 Google 帳號 `ouyangtaisen@gmail.com`，在 `https://tiancinge-web.web.app/` property 提交 `sitemap.xml`。
- Search Console 顯示「已成功提交 Sitemap」；這只證明提交請求已接受，不代表 Google 已完成下載或索引。
- 後續在 Sitemap 詳細頁重新檢查時，該列顯示：已送出 `2026年9月20日`、上次讀取 `2026/9/20`、狀態仍為「無法擷取」、系統探索到的網頁 `0`、影片 `0`；詳細頁訊息為「無法讀取 Sitemap」，Google 介面沒有提供更細的錯誤碼。
- 在 Hosting 版本 `ef9a46f041f5ccbe` 發布、CSP Report-Only 上線後再次開啟同一個詳細頁，畫面狀態沒有變化；這次檢查未重新提交 Sitemap，也未修改 property。
- 2026-09-20 16:27（Asia/Taipei）再次以 `ouyangtaisen@gmail.com` 開啟同一個 property：`/sitemap.xml` 類型仍為「未知」、狀態「無法擷取」、系統探索到的網頁 `0`、影片 `0`；網站端以 Node fetch 同時驗證 `/sitemap.xml` HTTP 200、`application/xml; charset=utf-8`，未重送提交。
- 同次網站端取證：一般 UA 與 `Googlebot/2.1` 都回 HTTP 200、無 redirect、`application/xml; charset=utf-8`、1,803 bytes、17 個 `<loc>`；兩個 response body SHA-256 都是 `1a496d2a150be27eca32eca3279b58fddba23f467f581c0f0af500c8e01efbf9`，可排除 UA cloaking 或 SPA HTML fallback。
- `/robots.txt` 一般 UA 與 `Googlebot/2.1` 皆回 HTTP 200、`text/plain; charset=utf-8`，內容包含 `Allow: /`、`Disallow: /api/`、`Disallow: /admin` 與 `Sitemap: https://tiancinge-web.web.app/sitemap.xml`。

## 2026-09-20 追加發布後網站端重驗

- 由 `tiancinge-sitemap-lastmod-20260920` 使用新來源封存完成 Cloud Build `3a1ca1e2-6fb6-4259-888b-9b6a5cbca7a4`；Hosting release `sites/tiancinge-web/releases/1789896109157000`。
- `/sitemap.xml` 目前 17 個 URL、2,104 bytes；一般 UA 與 `Googlebot` 都是 HTTP 200、`application/xml; charset=utf-8`，SHA-256 同為 `bdb47a5b0b0696a6eb2beef1173599f02fe691b34676c30a3ebda11e813f31e2`，並含 XML declaration。
- `python3 scripts/verify-sitemap.py` 與 `pnpm seo:audit` 均通過；網站端仍未重現 Google「無法讀取 Sitemap」錯誤，因此 GSC 狀態仍屬外部非同步待處理。

## 尚未取得的 Google 證據

目前已有新的讀取日期，但仍沒有成功處理結果、探索 URL 數或可操作的錯誤碼。因此無法把目前的「無法擷取」判定為網站端修正失敗，也不能把網站端 HTTP 200 當作 Google 已成功解析；Google 端仍需要非同步處理或顯示更完整錯誤。

## 下一步

提交已完成。沒有新結果前不要反覆刪除重送；以 48–72 小時作為人工首次回查節點，再依 Search Console 顯示的錯誤拆小卡。回查時需記錄最後讀取時間、狀態、探索 URL 數與錯誤細節；若仍無法擷取，再以該錯誤訊息建立獨立修正卡。

## 再次唯讀回查（2026-09-20 17:48 Asia/Taipei）

- 使用已登入的 Search Console property `https://tiancinge-web.web.app/` 開啟 Sitemap 列表與 `/sitemap.xml` 詳細頁；未重新提交、未修改 property。
- 列表仍顯示：類型「未知」、已送出 `2026年9月20日`、上次讀取 `2026/9/20`、狀態「無法擷取」、系統探索到的網頁 `0`、影片 `0`。
- 詳細頁仍顯示「無法讀取 Sitemap」，沒有新的錯誤碼或處理細節。
- 同一時間網站端驗證仍為 `/sitemap.xml` HTTP 200、`application/xml; charset=utf-8`、一般 UA 與 Googlebot body 相同、17 個 `<loc>`；因此目前新增的是 Google 外部狀態證據，未發現可由程式直接修正的新網站端錯誤。

## URL Inspection 交叉核對（2026-09-20 17:50 Asia/Taipei）

- 首頁 `https://tiancinge-web.web.app/`：Google 顯示「網址在 Google 服務中」與「網頁已編入索引」；上次檢索 `2026年9月20日 07:17:54`，Googlebot 智慧型手機，網頁擷取成功、允許檢索與編入索引，使用者宣告與 Google 選擇的 canonical 都是首頁本身。
- 服務詳情 `https://tiancinge-web.web.app/services/7usx1gzbua`：Google 顯示「網址不在 Google 服務中／Google 無法辨識的網址」，尚未檢索；Sitemap 與 Sitemap 參照網頁均顯示未偵測到任何參照。
- 長篇部落格 `https://tiancinge-web.web.app/blog/lob01tcsx5`：同樣顯示「Google 無法辨識的網址」，尚未檢索，Sitemap 參照未偵測到。
- 這組結果與網站端 17 URL 的完整 HTML、self-canonical 與內部 `<a href>` 稽核一致：目前缺口在 Google 的 Sitemap／發現資料尚未更新，不能把「首頁已索引」外推成所有內頁已索引。

## URL Inspection 線上測試（2026-09-20 17:54–17:57 Asia/Taipei）

- 長篇部落格 `https://tiancinge-web.web.app/blog/lob01tcsx5`：線上測試結果為「Google 可為網址建立索引」與「網頁可編入索引」；偵測到 1 個有效導覽標記，並偵測到影片探索項目。這表示目前公開 HTML、canonical、robots 與頁面資源可供 Google 即時擷取，尚未代表該網址已進入正式索引。
- 服務詳情 `https://tiancinge-web.web.app/services/7usx1gzbua`：線上測試結果同樣為「Google 可為網址建立索引」與「網頁可編入索引」；偵測到 1 個有效導覽標記。這表示服務頁的即時可抓取性正常，正式檢查畫面仍顯示尚未被 Google 發現／索引。
- 本次只執行「測試線上網址」，未點擊「要求建立索引」，也未重新提交 Sitemap；避免把尚未更新的外部發現狀態誤判為網站程式錯誤。

## 新版本發布後受控重新提交（2026-09-20 18:47 Asia/Taipei）

- 在正式 Hosting version `d70980235b1d38ce` 與 sitemap worker status `published` 後，使用已登入的 `ouyangtaisen@gmail.com` 於正確 URL-prefix property `https://tiancinge-web.web.app/`，重新提交一次 `sitemap.xml`。
- Search Console 顯示確認訊息「已成功提交 Sitemap」，並提示 Google 將定期處理與檢查變更。
- 提交完成後列表尚未同步更新，仍暫時顯示：類型「未知」、已送出 `2026年9月20日`、上次讀取 `2026/9/20`、狀態「無法擷取」、探索網頁 `0`、影片 `0`。這是提交成功與處理完成之間的非同步差異，不能提前宣稱已成功攝取。
- 本次只重新提交一次，未要求建立索引、未刪除 sitemap、未修改 property；下一次回查應記錄 Google 顯示的最後讀取時間、狀態與探索數。

後續服務詳情欄位發布至 Hosting version `db6427684a407dcd`（2026-09-20 19:02）後，sitemap URL 數與內容 SHA-256 仍維持 17 URLs／`bdb47a5b0b0696a6eb2beef1173599f02fe691b34676c30a3ebda11e813f31e2`，因此不重複提交；沿用同一筆 GSC 非同步處理結果，待下一個 48–72 小時回查節點。

19:31 helper-only 靜態同步後，Hosting version 更新為 `e0da0e7d679e23cb`，sitemap URL 數與 SHA-256 仍完全相同，未重複提交或移除 GSC 中既有項目。

## 19:43 唯讀回查

- 使用 `ouyangtaisen@gmail.com` 開啟正確 URL-prefix property `https://tiancinge-web.web.app/` 的 Sitemap 詳細頁。
- `/sitemap.xml` 仍顯示上次讀取 `2026/9/20`、系統探索到的網頁 `0`、影片 `0`、狀態「無法讀取 Sitemap」；頁面未提供 HTTP、XML 或 MIME 錯誤碼。
- 本次仍未移除或重複提交；正式站端點在 19:31 後的 HTTP／XML／Googlebot parity 檢查維持通過，因此目前沒有新的網站端修正依據。

19:52 已完成 robots 搜尋頁規則修正並發布；sitemap XML 內容未變更，因此沒有重複提交 GSC。`/search` 現在由 robots `Disallow` 排除，與既有搜尋頁 `noindex` 及安全驗收清單一致。

## 19:17 唯讀回查

- 正確 property：`https://tiancinge-web.web.app/`；Sitemap 詳情頁仍顯示 `/sitemap.xml`、上次讀取 `2026/9/20`、系統探索到的網頁 `0`、影片 `0`、狀態「無法讀取 Sitemap」。
- 詳情頁沒有提供 HTTP/XML 錯誤碼；「更多選項」只有「移除 Sitemap」，因此沒有新的可操作根因可供網站端修正。
- 這次只讀取報告，沒有移除或重新提交 Sitemap；網站端 `curl`／Googlebot parity／XML 驗證仍正常。

## 重新提交後唯讀回查（2026-09-20 18:49 Asia/Taipei）

- 同一個 URL-prefix property 的 Sitemap 列表已重新開啟；Google 介面尚未更新提交後的處理結果，仍顯示類型「未知」、上次讀取 `2026/9/20`、狀態「無法擷取」、探索網頁 `0`、影片 `0`。
- 沒有新增錯誤碼或詳細原因；網站端仍以 `python3 scripts/verify-sitemap.py` 與 `pnpm seo:audit` 通過為準。下一個合理動作是等待 Google 非同步處理，不再重複提交。

## 20:49 唯讀回查（Asia/Taipei）

- 使用已驗證的 `https://tiancinge-web.web.app/` property 重新讀取 Sitemap 報表，`/sitemap.xml` 仍顯示：類型「未知」、已送出 `2026年9月20日`、狀態「無法擷取」、系統探索到的網頁 `0`、影片 `0`。
- 本次只讀取報表，沒有刪除或重複提交 Sitemap。網站端最新 release 已是 version `159c0571d7307e94`，公開 `/sitemap.xml` 仍 HTTP 200、17 個 URL、XML MIME 與 Googlebot parity 通過。
- Google 介面仍沒有提供 HTTP、XML 或 MIME 錯誤碼；目前可判斷的缺口仍是 Google 外部處理／發現資料尚未同步，不能由網站端再推導新的程式根因。

## 20:12 唯讀回查（Asia/Taipei）

- 使用已登入的 `ouyangtaisen@gmail.com` 開啟同一個 URL-prefix property；Sitemap 列表仍顯示 `/sitemap.xml`、類型「未知」、已送出 `2026年9月20日`、上次讀取 `2026/9/20`、狀態「無法擷取」、探索網頁 `0`、影片 `0`。
- 本次介面仍未提供 HTTP、XML 或 MIME 錯誤碼；未移除、未重新提交，也未修改 property。
- 同時點網站端回歸：`/sitemap.xml` HTTP 200、`application/xml; charset=utf-8`、17 個 URL；`verify-sitemap.py` 與 `seo:audit` 均通過。因此 GSC 狀態仍是外部非同步處理，沒有新增可由程式直接修正的證據。
