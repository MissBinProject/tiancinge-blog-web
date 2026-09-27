# 驗收清單

- [ ] 後台儲存後重新整理，首頁顯示設定與完整價目表一致。
- [ ] 隱藏項目不出現在首頁、`/pricing`、服務關聯價目或 sitemap。
- [ ] 首頁只呈現 `showOnHome=true` 項目，排序符合 `homeSortOrder`。
- [ ] `/pricing` 有完整 server-rendered HTML、唯一 H1、title、description、canonical。
- [ ] 導覽連結可直接開啟 `/`、`/pricing`、`/news`、`/blog`，重新整理不回 404。
- [ ] 手機寬度下價目卡片不橫向溢出，按鈕與價格可讀。
- [ ] `pnpm typecheck`、`pnpm test`、`pnpm test:sitemap`、`pnpm --filter @tian-xin-ge/admin build` 通過。
- [ ] 線上 sitemap 含 `/pricing`，SEO baseline 與 indexability audit 通過。
