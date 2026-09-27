# S08｜帳號與來源限流

在現有 IP guard 外加入帳號雜湊 guard；只使用受 Cloud Run 信任的 proxy header。成功登入清理失敗計數，錯誤回應維持模糊化。測試多帳號同 IP、同帳號多 IP、偽造 XFF、429 與 TTL。
