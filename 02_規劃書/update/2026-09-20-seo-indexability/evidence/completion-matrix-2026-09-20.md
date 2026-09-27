# SEO 修改計劃完成矩陣

更新日期：2026-09-20

這份矩陣只記錄目前可由程式、正式站或外部介面直接證實的狀態。Google 的處理結果與店家未確認資料不以推論補齊。

| 卡片 | 目前狀態 | 證據／說明 |
|---|---|---|
| A01 公開端點取證 | 已完成 | `/sitemap.xml`、`/robots.txt`、公開頁面與 404 已驗證 HTTP、MIME、匿名存取、Googlebot 回應與 XML。 |
| A02 Search Console 時間線 | 已完成取證，網站端正常；Google Sitemap 發現資料仍未更新 | 2026-09-20 17:48–17:57、20:12、20:49（Asia/Taipei）核對正確 property：Sitemap 仍「無法擷取／0」；URL Inspection 顯示首頁已在 Google、服務與部落格詳情的正式狀態仍是「Google 無法辨識的網址」且 Sitemap 參照未偵測到，但兩個詳情頁的「測試線上網址」都回報可編入索引；網站端無新的可重現錯誤。 |
| A03 Hosting routing | 已完成 | Hosting 直接供應 sitemap／robots／靜態 HTML，未落入 SPA fallback；live smoke 通過。 |
| B01 可索引性稽核 | 已完成 | `seo:audit` 檢查 17 個 sitemap route、canonical、title、description、H1 文字與跨頁重複、robots、Breadcrumb、內鏈與圖片 alt；本次 `duplicateH1s` 為空。逐路由表格證據見 [`route-audit-2026-09-20.tsv`](route-audit-2026-09-20.tsv)。 |
| B02 metadata／完整 HTML | 已完成 | 首頁、列表、分類、分頁、服務、消息、部落格與政策頁有獨立 metadata；詳情頁直接回傳核心 HTML。 |
| C01 文章日期傳遞 | 已完成 | 公開快照保留 `contentUpdatedAt`，測試確認正文未變更不更新 lastmod。 |
| C02 服務內容日期 | 已完成 | 服務實質內容變更才更新 `contentUpdatedAt`，一般儲存不重設日期。 |
| C03 lastmod 規則 | 已完成 | sitemap 使用內容日期；無效、未來或無可信日期時省略。 |
| C04 sitemap 範圍 | 已完成 | 目前 17 個唯一 HTTPS URL；法律頁可存取但不列入 sitemap；草稿、隱藏服務、空分類排除。 |
| D01 服務內容 | 欄位與草稿完成；內容待店家確認 | 五筆服務的 SEO 欄位與待確認清單已建立；共用 contract、公開快照與詳情 metadata 已支援 `seoTitle`／`seoDescription`、服務流程、適用情境、注意事項與 FAQ，後台可編輯並有長度驗證。未把未確認流程、限制或價格寫入正式資料。稽核會分開計算服務 `<article>` 正文；目前五頁均短於 120 字，後台上架時顯示非阻擋式提醒。 |
| D02 服務頁呈現／內鏈 | 程式完成並已發布，內容待確認 | 詳情頁有摘要、詳細內容、預約入口、Breadcrumb、相關服務內鏈與 Service JSON-LD；`generateMetadata` 會使用服務自訂 SEO 欄位，空白時回退既有欄位；確認後的流程、適用情境、注意事項與 FAQ 會直接輸出於靜態 HTML。正式內容仍待店家確認。 |
| D03 消息／部落格內容 | 部落格已發布，消息待確認；後台已加入品質提示與作者欄位 | `/blog/lob01tcsx5` live response 約 1,702 字，含使用者提供段落、7 張圖片與 1 個影片；後台發布文章時會提示正文少於 120 字、缺摘要、SEO 描述、作者／編輯名稱或封面 alt。`authorName` 已打通 Admin → API → Firestore snapshot → 靜態 HTML／JSON-LD，未填時使用網站編輯團隊 fallback。現有 3 篇消息正文仍為 33、28、27 字，需店家確認活動／公告內容。 |
| D04 內容匯入／薄分類 | 待店家確認後執行 | 需確認作者、來源、活動有效期與分類內容，再匯入正式資料。 |
| E01 店家資料 | 部分完成 | 電話與地址已同步；每週營業時間仍待店家確認。 |
| F01 Preview 整合 | 已完成 | 靜態產物、sitemap、robots、HTML、canonical 與 audit 通過。 |
| F02 正式發布／回退 | 作者欄位版本已發布；CSP 觀察標頭已上線，正式緊急下架演練待執行 | 公開 Hosting 已更新至 version `159c0571d7307e94`、release `1789907651160000`；前一版本 `25abcd202eb42249`、source archive 與 worker revision `tiancinge-sitemap-00055-yeq` 已記錄。Admin Hosting 已發布作者／編輯欄位與品質提示，Cloud Run API 目前為 `tiancinge-web-totp-replay-20260920`，staging 1% 觀察與受保護 Cloud Run 回切已完成，正式 Hosting 緊急下架仍需維運窗口。 |
| F03 GSC 追蹤 | 已重新提交，等待外部結果 | Sitemap 已在正確 property 受控重新提交；截至 20:12 唯讀回查仍顯示上次讀取 `2026/9/20`、狀態「無法擷取」、探索 0、影片 0，且沒有 HTTP/XML 錯誤碼。2026-09-20 17:54–17:57 的服務／部落格即時測試可編入索引，但 Sitemap 仍尚未被 Google 正式讀取。 |

## 驗證命令

- `pnpm test:e2e`：13 passed，19 個需要管理員測試資料的案例略過。
- `pnpm --filter @tian-xin-ge/web test -- --run`：53 tests passed。
- `pnpm test:sitemap`：28 tests passed。
- `pnpm --filter @tian-xin-ge/web typecheck`、`pnpm --filter @tian-xin-ge/admin typecheck`：passed。
- `pnpm seo:baseline`：17 sitemap URL passed。
- `SEO_AUDIT_OUTPUT=... node scripts/audit-indexability.mjs`：17 sitemap route、0 errors。
- `python3 scripts/verify-sitemap.py`：17 HTTPS URL passed。
- `pnpm tasks:verify`：63 cards passed。
- `git diff --check`：passed。

## 尚未能由程式自行完成的驗收

1. Google 必須提供 sitemap 的實際處理結果或錯誤碼。
2. 店家必須確認營業時間、服務流程／價格條件、活動有效期、作者與文章來源。
3. 管理員必須完成 TOTP／恢復碼正式註冊與真實復原演練；正式 Hosting 緊急下架仍待安排；CSP enforce 需先完成 24 小時 report-only 觀察。Firestore `storagePath` 與 Storage 物件的複合復原已完成，證據見 `../../data-security/evidence/2026-09-20-firestore-storage-composite-restore.md`。
