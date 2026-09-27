# Firebase Luna 任務卡 C：管理後台

> 歷史版本：本卡組的 Firebase Auth／Firestore 直連流程已停用。現行後台只呼叫 Cloud Run server account API；MFA、session 與安全待辦請以 `update/data-security/luna-tasks/` 為準。

後台採 React、Vite、TypeScript；每卡只交付一個列表、表單或編輯器能力。所有圖片欄位必須透過共用素材選擇器或上傳，不提供手填圖片 URL。

## FB-C01 後台 Firebase Auth adapter

- 參考圖：`02_規劃書/project/technical-plan.md`；目標：封裝 Firebase 登入、登出、重設密碼與 session。
- 前置任務：FB-A03。可修改：`apps/admin/src/auth.ts`、登入畫面測試。
- 固定契約：畫面只呼叫 `signInAdmin`／`signOutAdmin`／`requestPasswordReset`；登入後查 `admins/{uid}`；無權限立即登出。
- 步驟：實作 Auth SDK adapter → 訂閱 session → 顯示逾時／權限錯誤 → 接忘記密碼 → 測試成功與失敗。
- 驗收：管理員可登入／登出；密碼重設信件流程可觸發；錯誤訊息清楚且不洩漏帳號是否存在。
- 交接紀錄：已完成；正式管理員由 Firebase Authentication 管理，密碼不寫入 repo。

## FB-C02 清單表格與共用分頁

- 參考圖：`ui-templates.md`；目標：建立所有後台模組共用的清單列、狀態、搜尋、分頁與空／錯誤狀態。
- 前置任務：FB-B02～FB-B07。可修改：`apps/admin/src/main.tsx`、`apps/admin/src/styles.css`、共用元件。
- 固定契約：列表頁顯示查詢條件、筆數、目前頁碼與操作；手機不得水平溢出；編輯表單與列表分欄。
- 步驟：建立 ListRow／Pagination → 套用 loading／empty／error → 加入鍵盤焦點與 aria → 在服務、文章、素材、留言驗證。
- 驗收：所有內容管理頁以列表呈現；查詢與頁碼可重設；390／768px 不溢出。
- 交接紀錄：已完成；服務、文章、分類、素材、留言均使用清單式元件。

## FB-C03 服務清單頁

- 參考圖：`首頁_01.png`；目標：服務列表顯示名稱、價格、排序、上下架狀態與新增入口。
- 前置任務：FB-C02、FB-B02。可修改：服務頁元件與樣式。
- 固定契約：排序依 `sortOrder`；狀態以「已上架／已隱藏」；新增服務自動取得 10 位 code。
- 步驟：接 repository → 建立列表列 → 加入新增／選取 → 顯示空列表與錯誤 → 驗證排序。
- 驗收：可由列表進入編輯；新增入口可用；不顯示可手動輸入的 code 欄位。
- 交接紀錄：已完成；後台服務列表已部署至 `tiancinge-admin.web.app`。

## FB-C04 服務編輯頁與圖片選擇

- 參考圖：`首頁_01.png`、素材對照表；目標：編輯服務內容、時間、價格、狀態及圖片。
- 前置任務：FB-B02、FB-B07、FB-C03。可修改：服務表單、`MediaPicker`。
- 固定契約：code 顯示唯讀；價格空白代表洽詢；圖片只能選 MediaAsset；圖片／欄位驗證失敗不得寫入。
- 步驟：建立欄位 → 接素材選擇器 → 加入價格／排序驗證 → 儲存／刪除確認 → 顯示成功與錯誤。
- 驗收：服務圖片可替換；首頁與價格區同步；代碼始終為 10 位小寫英數亂碼。
- 交接紀錄：已完成；Firebase repository 與公開服務頁共用同一份服務資料。

## FB-C05 最新消息清單頁

- 參考圖：`首頁_03.png`；目標：只管理 `type=news` 的文章，具搜尋、狀態篩選、分頁。
- 前置任務：FB-B04、FB-C02。可修改：`ArticlesEditor` 的 news view、路由導航。
- 固定契約：頁面路徑 `/news`；列表只顯示消息；草稿標示 draft；新增文章自動產生 code。
- 步驟：傳入 `initialType="news"` → 建立搜尋／狀態控制 → 接列表分頁 → 加入預覽／編輯入口。
- 驗收：部落格文章不出現；查詢與分頁可用；空資料有明確提示。
- 交接紀錄：已完成；側欄「最新消息」獨立按鈕已上線。

## FB-C06 部落格清單頁

- 參考圖：`首頁_04.png`；目標：只管理 `type=blog` 的文章，操作方式與消息一致。
- 前置任務：FB-C05。可修改：`ArticlesEditor` 的 blog view、路由導航。
- 固定契約：頁面路徑 `/blog`；只顯示部落格；分類篩選與消息完全隔離。
- 步驟：傳入 `initialType="blog"` → 套用共用搜尋／分頁 → 驗證分類 → 接預覽／編輯。
- 驗收：消息文章不出現；側欄與頁面標題清楚；手機版可操作。
- 交接紀錄：已完成；側欄「部落格」獨立按鈕已上線。

## FB-C07 Tiptap 基本工具列

- 參考圖：`ui-templates.md`；目標：提供接近 Word 的結構化正文編輯：標題、段落、粗體／斜體、清單、復原／重做。
- 前置任務：FB-B05、FB-C05。可修改：`apps/admin/src/components/RichTextEditor.tsx`、`rich-text-editor.css`。
- 固定契約：輸出 Tiptap JSON，再轉成 ArticleBodyBlock；禁止任意 HTML；工具列按鈕有 aria label。
- 步驟：安裝 StarterKit → 建立 toolbar → 對接受限 schema → 載入既有正文 → 儲存後重新載入。
- 驗收：格式能保存並重現；不支援的節點被排除；鍵盤與按鈕操作正常。
- 交接紀錄：已完成；Tiptap 3.31.3 已鎖定於 admin package。

## FB-C08 Tiptap 圖片與連結

- 參考圖：素材對照表；目標：正文插入已上傳圖片與安全連結。
- 前置任務：FB-B07、FB-C07。可修改：RichTextEditor、MediaPicker、contracts validator。
- 固定契約：圖片從共用素材選擇器帶入；連結只接受安全協定；正文圖片引用要能被素材刪除保護掃描。
- 步驟：加入 Image／Link extension → 建立插入圖片按鈕 → 透過素材選擇器選檔 → 驗證 URL → 轉回受限 block。
- 驗收：圖片可插入、替換、重現；`javascript:`、不安全 protocol 被拒；使用中素材不可刪。
- 交接紀錄：已完成；正文圖片流程已納入後台共用素材資料。

## FB-C09 文章預覽、草稿與發布

- 參考圖：`ui-templates.md`；目標：提供草稿保存、預覽、發布、下架與未儲存離頁提醒。
- 前置任務：FB-B05、FB-C08。可修改：文章編輯器、預覽 dialog、路由保護。
- 固定契約：草稿不進公開列表／搜尋／sitemap；空正文不可發布；預覽只渲染通過 validator 的 block。
- 步驟：建立狀態切換 → 加入發布前檢查 → 建預覽 dialog（Escape 關閉）→ 加入 dirty guard → 驗證下架 404。
- 驗收：草稿可保存與預覽；發布後公開；下架立即不公開；離頁會提醒未保存變更。
- 交接紀錄：已完成；公開站 draft 路徑回 404，後台預覽可用。

## FB-C10 分類清單頁

- 參考圖：`ui-templates.md`；目標：以列表管理消息／部落格分類，並阻擋使用中刪除。
- 前置任務：FB-B03、FB-C02。可修改：分類 manager、樣式。
- 固定契約：列表列顯示分類名稱、類型與文章引用數；刪除需確認；使用中的分類不可刪。
- 步驟：接 repository → 依 type 分組 → 建立新增／編輯／刪除 → 顯示引用錯誤 → 驗證手機列表。
- 驗收：分類清單完整；消息／部落格類型可辨識；引用保護錯誤清楚。
- 交接紀錄：已完成；後台分類管理整合於文章管理區。

## FB-C11 素材清單與上傳頁

- 參考圖：`asset-map.md`；目標：列表預覽、搜尋、MIME／大小篩選、上傳及替代文字編輯。
- 前置任務：FB-B07、FB-C02。可修改：素材頁、樣式、upload adapter。
- 固定契約：只接受 JPEG／PNG／WebP、≤10 MB；顯示尺寸與大小；使用中的素材刪除被拒。
- 步驟：建立搜尋列 → 顯示 compact row → 接 file input → 上傳進度／錯誤 → 編輯 alt → 刪除確認。
- 驗收：圖片上傳後可被各表單選取；搜尋不載入全部預覽；非法檔案與引用刪除均有提示。
- 交接紀錄：已完成；23 筆 fixture metadata 可搜尋，正式圖片可由此頁上傳 Storage。

## FB-C12 留言清單與詳情頁

- 參考圖：`首頁_05.png`；目標：清單篩選未處理／已處理、查看詳情、備註、標記及刪除。
- 前置任務：FB-B06、FB-C02。可修改：留言頁、樣式。
- 固定契約：狀態只有 unread／handled；內部備註不公開；刪除需二次確認；列表依建立時間倒序。
- 步驟：接 repository → 建立狀態篩選與分頁 → 詳情面板 → 保存備註／標記處理 → 顯示 API 錯誤。
- 驗收：留言可追蹤處理狀態；備註重新整理仍存在；匿名無法取得留言。
- 交接紀錄：已完成；後台留言列表可查看 Firestore contact_messages。

## FB-C13 設定清單與編輯頁

- 參考圖：`首頁_01.png`～`首頁_05.png`；目標：管理基本聯絡、首頁區塊、SEO、政策與背景圖片。
- 前置任務：FB-B01、FB-B07、FB-C02。可修改：設定 editor、MediaPicker。
- 固定契約：固定版型，只編輯內容欄位；Logo／背景／OG 圖使用素材選擇器；地圖與 LINE URL 驗證 HTTPS。
- 步驟：分區呈現設定 → 接圖片選擇器 → 加入文字／JSON benefits 驗證 → 儲存回饋 → 刷新官網驗證。
- 驗收：設定保存後下一次動態請求即更新；圖片沒有手填 URL 欄位；長文字、危險 URL 有錯誤提示。
- 交接紀錄：已完成；設定頁與素材管理已部署，正式電話／地址／政策待店家確認。
