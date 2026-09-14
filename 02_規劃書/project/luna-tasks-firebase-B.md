# Firebase Luna 任務卡 B：資料與 API

每卡固定交付：修改檔案、命令與結果、資料筆數／API 回應、提交 SHA、已知限制。Repository 是唯一資料邊界，畫面不可直接寫 Firestore query。

## FB-B01 設定 repository

- 參考圖：`firebase-data-api-plan.md`；目標：完成網站設定的讀取／保存 adapter。
- 前置任務：FB-A05。可修改：`apps/admin/src/repositories.ts`、`apps/web/src/lib/data.ts`、contracts。
- 固定契約：設定只有 `site_settings/singleton`；必要品牌／電話／LINE／地址／營業時間缺失時正式前台拋錯；本機未配置才回 fixture。
- 步驟：定義 mapper → 實作 load/save → 驗證 LINE、地圖、圖片 URL → 加入錯誤回傳 → 執行型別與單元測試。
- 驗收：後台保存後重新整理官網可見；危險 URL 被拒；正式讀取失敗不顯示測試資料。
- 交接紀錄：已完成；設定已匯入 Firestore，Cloud Run 動態讀取。

## FB-B02 服務 repository

- 參考圖：`03_UI設計圖/01_首頁設計圖/首頁_01.png`；目標：服務查詢、排序、價格與上下架。
- 前置任務：FB-A06。可修改：服務 repository、`ServicesSection`、`PricingSection`、服務測試。
- 固定契約：`sortOrder` 決定首頁／價格順序；`price` 可空且顯示洽詢；只公開 `isVisible=true`；圖片走 MediaAsset URL。
- 步驟：建立 mapper → 實作列表／單筆 → 以記憶體排序避免複合 index → 接首頁、價格、詳情 → 測試隱藏與洽詢價格。
- 驗收：同一服務資料同時出現在服務、價格及詳情；隱藏服務與不存在 code 回 404。
- 交接紀錄：已完成；Firestore 5 項服務、公開頁服務 code smoke test 通過。

## FB-B03 分類 repository

- 參考圖：`ui-templates.md`；目標：消息／部落格分類的 CRUD 與引用保護。
- 前置任務：FB-A02。可修改：分類 repository、分類後台元件與 Rules 測試。
- 固定契約：分類 `type` 只有 `news`／`blog`；同名不同 type 不互相覆寫；文章引用中的分類不可刪。
- 步驟：實作列表／保存／刪除 → 查詢使用中文名稱引用 → 加入刪除前檢查 → 測試跨類型與使用中刪除。
- 驗收：分類只出現在相同文章類型；使用中的分類刪除回明確錯誤；未授權寫入遭拒。
- 交接紀錄：已完成；Firestore 7 個分類已匯入，後台分類清單可用。

## FB-B04 文章清單搜尋 repository

- 參考圖：`03_UI設計圖/首頁_03.png`、`首頁_04.png`；目標：文章清單依類型、狀態、關鍵字與頁碼查詢。
- 前置任務：FB-B03。可修改：文章 repository、文章列表元件與測試。
- 固定契約：`type` 僅 `news`／`blog`；公開只回 `published`；後台可讀草稿；搜尋標題／摘要；頁碼從 1 起算。
- 步驟：讀取文章 → mapper 統一 camelCase／snake_case → 先依日期排序 → 套用 type／status／keyword／page → 顯示空資料與總頁數。
- 驗收：最新消息與部落格不混頁；草稿不進公開 repository；搜尋及分頁結果穩定。
- 交接紀錄：已完成；Firestore 8 篇文章（7 published、1 draft），後台 news／blog 分頁獨立。

## FB-B05 文章保存與發布 repository

- 參考圖：`ui-templates.md`；目標：文章基本資料、結構化正文、草稿／發布狀態。
- 前置任務：FB-B04、FB-A06。可修改：文章 repository、`packages/contracts` 驗證。
- 固定契約：正文只允許 heading／paragraph／list／link／image；最多 100 blocks、每 list 最多 100 items；空正文只能 draft；code 由系統產生。
- 步驟：解析 Tiptap JSON → 驗證 schema／安全 URL → 寫入 Firestore → 發布前檢查正文 → 回傳新增 ID 與 code。
- 驗收：非法正文、危險圖片／連結、空正文發布均拒絕；保存草稿後可預覽；發布後公開詳情可取得。
- 交接紀錄：已完成；7 篇發布、1 篇草稿已 seed，公開 draft URL 回 404。

## FB-B06 留言 repository

- 參考圖：`03_UI設計圖/01_首頁設計圖/首頁_05.png`；目標：後台留言列表、詳情、備註、狀態與刪除。
- 前置任務：FB-A05。可修改：留言 repository、後台留言元件與測試。
- 固定契約：狀態只有 `unread`／`handled`；訪客不可直接讀寫；管理員可保存 `note`；列表依建立時間倒序。
- 步驟：實作 load／update／delete → 建立狀態篩選與分頁 → 失敗保留輸入 → 驗證 Rules 與 API 邊界。
- 驗收：留言可標記處理與保存備註；刪除需確認；匿名讀取遭拒。
- 交接紀錄：已完成；Firestore 2 筆測試留言已匯入，API／後台列表可用。

## FB-B07 素材 repository

- 參考圖：`03_UI設計圖/asset-map.md`；目標：圖片上傳、替代文字、尺寸資訊與引用保護。
- 前置任務：FB-A04。可修改：素材 repository、`MediaPicker`、後台素材頁。
- 固定契約：Storage path=`site-media/*`；JPEG／PNG／WebP、≤10 MB；使用中的圖片不能刪；正文圖片也算引用。
- 步驟：上傳 → 取得 download URL → 寫入 media metadata → 列表搜尋／篩選 → 刪除前掃描設定／服務／文章／正文。
- 驗收：上傳圖片可在所有表單選用；替代文字可修改；使用中刪除被阻擋；非法檔案被拒。
- 交接紀錄：已完成；23 筆素材 metadata 已匯入，正式 Storage 上傳由後台執行。

## FB-B08 Contact API Firestore transaction

- 參考圖：`firebase-data-api-plan.md`；目標：訪客留言的驗證、限流、防重送及交易寫入。
- 前置任務：FB-A05。可修改：`apps/web/src/app/api/contact/route.ts`、測試。
- 固定契約：每來源每分鐘最多 5 次；相同 phone+message 30 秒內拒絕；成功只建立一筆 `contact_messages`；失敗回 JSON error。
- 步驟：讀取 request body → 驗證姓名／電話／Email／訊息 → transaction 寫 guards／duplicates／message → 清理過期 guard → 回應 201。
- 驗收：空資料 400、重複 409、超頻 429；成功後後台能看見；前端失敗保留輸入。
- 交接紀錄：已完成；公開空資料 smoke test HTTP 400，成功與失敗流程由 Playwright 覆蓋。

## FB-B09 資料匯入工具

- 參考圖：`firebase-deployment.md`；目標：以可重跑腳本匯入 fixture 與初始設定。
- 前置任務：FB-B01～FB-B07。可修改：`apps/web/scripts/seed-firebase.ts`、匯入說明。
- 固定契約：seed 不寫密碼；設定 singleton merge；服務／文章維持 10 位 code；報告各 collection 筆數。
- 步驟：使用 ADC 初始化 Admin SDK → batch set → 輸出筆數 → 重新執行 → 讀回比對。
- 驗收：可在空專案建立完整測試資料；重跑不重複；公開讀取只看到發布／可見資料。
- 交接紀錄：已完成；`tiancinge` 已匯入 5 services、8 articles、23 media、2 messages。
