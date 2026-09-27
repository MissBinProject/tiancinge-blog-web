# L17｜文章目錄與穩定錨點

## 目標
在文章有足夠小標題時提供可爬取、可分享的目錄。

## 前置
L15。

## 修改範圍
新增 `apps/web/src/components/ArticleToc.tsx`，修改 `ArticleBody.tsx` 與文章樣式／測試；不得引入前端路由套件。

## 固定規格
只有三個以上 H2／H3 才顯示；ID 由 heading 文字產生並在重複時加序號，對相同正文輸出穩定；目錄使用普通 `href="#..."`；H1 不加入目錄；固定導覽以 CSS scroll-margin 避免遮擋。

## 驗收
測試 0、2、3、重複及特殊字元 headings；停用 JS 可點擊；頁面只有一個 H1；ID 不含未轉義 HTML。

## 交接紀錄
記錄 ID 產生規則、DOM 位置及 L24 的手機驗收案例。
