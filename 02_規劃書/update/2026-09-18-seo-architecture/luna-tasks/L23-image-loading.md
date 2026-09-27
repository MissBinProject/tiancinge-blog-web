# L23｜圖片尺寸、比例與載入策略

## 目標
降低圖片造成的版面位移與不必要下載，並維持具體 alt。

## 前置
L01。

## 修改範圍
只修改 `apps/web/src/components/SafeImage.tsx`、文章列表／詳情圖片與相關 CSS／測試；不得開放任意外部圖片代理。

## 固定規格
列表與詳情圖片提供 width／height 或固定 aspect-ratio 及 responsive sizes；詳情封面 eager + high priority，其餘 lazy；圖片來源只接受既有安全 URL；alt 使用資料提供值，缺值 fallback 到標題／名稱；保留缺圖 fallback。

## 驗收
測試缺 src、外部 HTTP、script URL、缺 alt、不同尺寸；以 390／768／1440 px 檢查無水平溢出與明顯 CLS；SSR HTML 有 alt 與尺寸資訊。

## 交接紀錄
尺寸契約、CSS aspect-ratio、alt 上下文與三次手機 Lighthouse 中位數已記錄於 `../validation-checklist.md` 與 `../evidence/lighthouse-mobile-2026-09-20.json`；後續需在內容變更或圖片資產替換後重新量測。
