# S14｜CSP 與安全標頭

盤點實際 script/style/font/img/connect/frame 來源，先在 Next config 加 `Content-Security-Policy-Report-Only`，確認首頁、詳情頁、後台、Firebase Storage 圖片、地圖與社群連結無錯，再切 enforce。不得使用 `unsafe-eval`；若需 `unsafe-inline` 必須提出具體來源與替代方案。
