# L24｜sitemap、整合驗收與發布證據

## 目標
整合所有 SEO 卡片，產出可供發布與 Search Console 追蹤的完整證據。

## 前置
L03～L23 全部完成；任何卡片未交接不得跳過。

## 修改範圍
只修改 sitemap lastmod／公開範圍需要的程式、驗收腳本、`validation-checklist.md`、`release-checklist.md` 與 evidence 文件；正式部署需由統籌流程執行。

## 固定規格
sitemap 只列公開 URL，文章 `lastmod` 使用 `contentUpdatedAt`，缺值回退發布／可信更新時間；記錄 HTTP、SSR、404、JSON-LD、圖片、RWD、效能、Playwright、typecheck、build 及 Search Console 四種狀態。

## 驗收
執行 `pnpm seo:baseline`、`pnpm --filter @tian-xin-ge/web test`、`pnpm typecheck`、`pnpm --filter @tian-xin-ge/web build`、`pnpm exec playwright test --workers=1`、`git diff --check`；抽查草稿／隱藏內容不曝光；完成 staging smoke、保留上一 revision、記錄回退步驟與 GSC 證據。

## 交接紀錄
交付版本、測試輸出、sitemap URL 數量、GSC 提交／即時擷取／解析／收錄狀態、已知限制與後續第 7／28 天檢查日期。
