# L16｜後台編輯器保留 H2／H3

## 目標
讓管理員在文章格式工具列選擇 H2／H3，並在重開文章後保留設定。

## 前置
L15。

## 修改範圍
只修改 `apps/admin/src/components/RichTextEditor.tsx`、其序列化／匯入邏輯、editor CSS 與測試；不得改公開 renderer。

## 固定規格
新 heading 預設 H2；H3 可切換；舊資料無 level 視為 H2；貼上或匯入不接受任意 HTML tag；存檔前仍走既有 body 驗證、版本與 audit。

## 驗收
建立 H2／H3、切換、重整、編輯舊文章、貼上含 h1／script 內容；確認 payload 只有受限結構化 block。

## 交接紀錄
記錄 editor payload 範例與 L17 目錄測試資料。
