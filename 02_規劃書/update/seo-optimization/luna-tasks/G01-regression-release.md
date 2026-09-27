# G01｜SEO 回歸與發布門檻

## 目標
把 SEO、SSR、資料隔離、手機版與安全檢查納入每次發布。

## 範圍
更新 Vitest、Playwright、HTTP smoke script 與 release checklist。

## 驗收證據
`pnpm --filter @tian-xin-ge/web test`、typecheck、build、Playwright、curl smoke 全部通過；Cloud Run revision health check 200。

## 交接
附 revision id、測試摘要、回退 revision 與發布後抽查結果。
