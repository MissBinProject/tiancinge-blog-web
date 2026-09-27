# E01｜圖片、字型與首屏效能

## 目標
降低首頁背景與卡片圖片傳輸量，避免首屏被非必要資源阻塞。

## 範圍
修改公開圖片格式／尺寸、載入策略與 CSS；保留視覺比例與可讀性。

## 步驟
1. 盤點大於 300 KB 的圖片，產生 WebP/AVIF 或響應式尺寸。
2. 首屏只 preload/LCP eager 圖片，其餘 lazy。
3. 檢查字型載入與快取 header。

## 驗收證據
Lighthouse mobile/desktop 與 network waterfall；75th percentile 目標 LCP ≤2.5s、INP ≤200ms、CLS ≤0.1。

## 交接
附資源大小前後比較與不支援格式的 fallback。
