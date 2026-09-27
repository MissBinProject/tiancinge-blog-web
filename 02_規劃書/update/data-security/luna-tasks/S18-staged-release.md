# S18｜分階段發布與回滾

狀態：staging／1% 觀察／回切與正式切換已完成；24 小時後續觀察待執行。

固定 image digest 建立 staging revision，執行 smoke/E2E、IAM、rules、SEO 檢查後小比例切流量。觀察 15 分鐘 5xx、403、記憶體與延遲；保留前一 revision 並演練回滾。完成 24 小時後檢查備份、登入、上傳、留言與後台資料載入。
