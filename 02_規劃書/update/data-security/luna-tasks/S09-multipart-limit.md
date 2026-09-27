# S09｜Multipart 上傳資源限制

在 `apps/web/src/app/api/admin/media/route.ts` 先檢查 Content-Length，再限制 multipart 總讀取 bytes、檔案數與單檔大小；超限立即取消 stream 並回 413。保留現有 MIME、尺寸、授權檢查。加入不帶 Content-Length 的串流超限測試。
