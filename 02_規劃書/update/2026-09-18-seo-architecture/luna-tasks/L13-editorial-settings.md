# L13｜編輯團隊設定欄位與 API

## 目標
提供真實且可由店家確認的編輯團隊名稱、簡介與編輯原則。

## 前置
無；先讀 `data-contract.md`。

## 修改範圍
只修改 `packages/contracts/src/index.ts`、設定 schema／mapper、管理設定 API 與測試；不得新增人員資料。

## 固定規格
`editorialTeamName` 最多 120 字，`editorialBio`、`editorialPolicy` 各最多 3000 字；選填；缺值使用品牌＋編輯團隊作為顯示名稱；沿用既有授權、If-Match、版本與 audit。

## 驗收
測試缺值、完整值、超長值、HTML／script 文字；未登入拒絕；儲存後重整值一致；不寫 localStorage 內容快照。

## 交接紀錄
記錄設定 key、限制與 L14 可用的完成判定。
