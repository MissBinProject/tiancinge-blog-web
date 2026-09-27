# C02｜素材替代文字與尺寸

## 目標
所有內容圖片有具體 alt，且版面在圖片載入前有穩定尺寸。

## 範圍
修改素材管理、SafeImage、文章／服務卡片 CSS；不得改圖片內容或捏造描述。

## 步驟
1. 上傳時要求或提醒具體 alt，保留既有素材 alt。
2. 卡片與詳情圖片設定 aspect-ratio、width/height 或等效佔位。
3. 首屏圖片指定 eager，其餘圖片 lazy/async。

## 驗收證據
HTML 每個非裝飾圖片有具體 alt；Lighthouse CLS 改善且手機不水平溢出。

## 交接
提供圖片清單、尺寸策略與前後 CLS 數值。
