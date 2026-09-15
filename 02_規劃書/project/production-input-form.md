# 正式上線資料輸入表

這份表在正式資料確認與上線前由店家或部署負責人填寫。密碼、服務帳號金鑰與 Firebase API 私密設定不要寫入此檔案；只在 Firebase／GCP 的環境變數、Secret Manager 或密碼管理器保存。

## 店家資料

| 欄位 | 填寫值 | 用途 |
|---|---|---|
| 品牌正式名稱 |  | `site_settings.brand_name` |
| 聯絡電話 |  | 首頁、服務詳情、SEO |
| LINE ID／正式加好友連結 |  | 預約按鈕、QR Code、社群 |
| 正式地址 |  | 聯絡區與地圖 |
| 營業時間 |  | 聯絡區 |
| Instagram |  | Header／聯絡區 |
| Facebook |  | Header／聯絡區 |
| YouTube |  | 聯絡區 |
| 地圖 Embed URL |  | 聯絡區地圖；需對應正式地址 |

## 內容與素材

- [ ] 確認五項服務名稱、介紹、分鐘數、價格／洽詢、排序及是否上架。
- [ ] 提供最新消息／部落格正式標題、分類、摘要、封面、正文與發布日期。
- [ ] 提供原始卡片照片、原始字型及需要保留的 Logo 版本。
- [ ] 提供隱私權政策、服務條款、SEO title／description 及 OG 分享圖。
- [ ] 確認首頁各區標題、副標題、消息特色列與價格信任列（各最多四筆）文案。

## Firebase／GCP

| 項目 | 填寫值或完成日期 |
|---|---|
| Firebase project ID | `tiancinge` |
| Firebase／GCP region | `asia-east1` |
| 後台登入帳號 | `tiancinge` |
| Auth 管理員恢復信箱（僅供 Firebase 驗證／重設密碼） | `ouyangtaisen@gmail.com` |
| Auth 管理員 UID／`admins/{uid}` |  |
| 官網 Firebase Hosting URL | `https://tiancinge-web.web.app` |
| 後台 Firebase Hosting URL | `https://tiancinge-admin.web.app` |
| Cloud Run service／URL | `tiancinge-web`／  |
| `NEXT_PUBLIC_SITE_URL` | `https://tiancinge-web.web.app` |
| Cloud Run `FIREBASE_PROJECT_ID`／`FIREBASE_STORAGE_BUCKET` |  |
| 後台 `VITE_FIREBASE_*`／`VITE_WEB_URL` | ☐ |
| 已關閉 Firebase 公開註冊 | ☐ |
| 已完成 Firestore seed／Rules／Storage Rules | ☐ |
| 已設定 Firebase/GCP Budget 通知 | ☐ |

## 上線簽核

- [ ] 匿名瀏覽器看不到草稿、隱藏服務及留言。
- [ ] 唯一管理員可登入、修改服務／文章／素材／設定並在官網看到更新。
- [ ] 聯絡表單成功後，後台收到正確留言；失敗時輸入內容保留。
- [ ] 390、768、1440、1672px 無水平溢出，五張設計稿疊圖已確認。
- [ ] 已完成資料庫與 `site-media` 備份、回復演練及部署回退方案。

填妥後依 [`release-checklist.md`](release-checklist.md) 與 [`firebase-deployment.md`](firebase-deployment.md) 執行 E10／E11，並將日期、操作者、URL、截圖與差異寫回對應 Firebase Luna 卡的交接紀錄。

> 舊版 Supabase／Vercel 欄位已移除；歷史實作仍保留在 `supabase/` 與舊版 Luna 卡，僅供變更追蹤。
