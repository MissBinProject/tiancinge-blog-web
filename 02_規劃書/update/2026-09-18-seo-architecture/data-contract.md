# SEO 資料契約

## 1. 文章新增欄位

```ts
type ArticleSource = {
  title: string; // 1～160 字
  url: string;   // HTTPS，最多 2048 字
};

type Article = {
  // existing fields...
  sources?: ArticleSource[];       // 最多 10 筆
  contentUpdatedAt?: string;       // ISO 8601；實質內容變更時更新
  authorName?: string;             // 本輪公開固定 fallback 為編輯團隊
};
```

`authorName` 不接受自由輸入的資格宣稱；若未填或不符合固定團隊規則，公開頁面使用「天心閣養生會館編輯團隊」。

## 2. 分類新增欄位

```ts
type ArticleCategory = {
  id: string;
  name: string;
  type: 'news' | 'blog';
  description?: string;    // 最多 2000 字
  seoTitle?: string;       // 最多 160 字
  seoDescription?: string; // 最多 300 字
};
```

缺值時：分類頁 H1 使用分類名稱；description 使用網站對應列表副標；SEO title 使用「分類｜列表標題｜品牌」；SEO description 使用「品牌的分類最新消息／養生文章」。沒有公開文章的分類不得成為公開索引入口。

## 3. 網站設定新增欄位

```ts
type EditorialSettings = {
  editorialTeamName?: string; // 最多 120 字，預設品牌＋編輯團隊
  editorialBio?: string;      // 最多 3000 字
  editorialPolicy?: string;   // 最多 3000 字
};
```

兩個介紹欄位未完整填寫時，`/editorial` 回傳 `noindex,follow` 並不加入 sitemap；不因缺資料回退到示意人員資訊。

## 4. 正文 heading

```ts
type ArticleHeading = ArticleBodyBlock & {
  type: 'heading';
  level?: 2 | 3; // 舊資料缺省為 2
};
```

其他 heading level 一律拒絕；H1 只由頁面標題輸出。內容目錄只收集 H2／H3。

## 5. 驗證與相容

- 新欄位都是選填；舊 Firestore 文件缺值時映射為空陣列、空字串或發布日期 fallback。
- `sources` 的 title 不得為空；URL 只接受 HTTPS，禁止 `javascript:`, `data:`、`vbscript:` 與空白。
- `contentUpdatedAt` 只有標題、摘要、正文、封面 URL／alt、來源清單實質變更才更新；單改 SEO title／description 不更新。
- 所有公開 mapper 必須先驗證 status、可見性與安全 URL；驗證失敗不輸出原始資料。
- 新欄位仍走既有管理員授權、版本條件與 audit；不得寫入 localStorage 內容快照。
