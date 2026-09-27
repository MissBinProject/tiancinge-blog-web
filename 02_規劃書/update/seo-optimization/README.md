# SEO 優化交付包

本交付包建立日期：2026-09-15。當時的基線是 `https://tiancinge-web.web.app/`、Next.js、Firebase Hosting rewrite、Cloud Run 與 Firestore；後續 2026-09-19～20 已完成靜態發布遷移。現在正式公開頁由 Firebase Hosting 靜態 HTML 供應，Cloud Run 僅保留 API、管理 API 與發布協調，Firestore 內容變更會觸發快照重建與 Hosting 發布。最新狀態請以 [`2026-09-20-seo-indexability`](../2026-09-20-seo-indexability/README.md) 及 [`2026-09-19-static-hosting`](../2026-09-19-static-hosting/README.md) 為準。

文件順序：

1. `audit-report.md`：現況檢查與風險。
2. `implementation-plan.md`：技術實作順序與 Luna 工作卡索引。
3. `data-contract.md`：SEO 欄位及內容規則。
4. `content-review.md`：待店家確認的文案與營業資料。
5. `validation-checklist.md`、`release-checklist.md`：驗收與發布門檻。
6. `luna-tasks/`：每張可獨立完成的工作卡。

本輪已完成可由程式與部署權限直接處理的索引、完整靜態 HTML、結構化資料、圖片效能與 HTTPS 驗證；Search Console 已由具 property 權限的帳號提交一次，目前 Google 顯示最後讀取日期但仍為「無法擷取」，因此不把外部處理結果當作程式已成功。提交與後續唯讀回查證據以 `../2026-09-20-seo-indexability/evidence/a02-gsc-followup-2026-09-20.md` 為準。
