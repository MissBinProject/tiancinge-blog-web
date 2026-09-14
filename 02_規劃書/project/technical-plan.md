# 技術計畫

- `apps/web` 使用 Next.js App Router、TypeScript；目前以固定 class 命名的全域樣式檔維持設計稿疊圖精度，公開頁面採伺服器渲染。
- `apps/admin` 使用 React、Vite、TypeScript；正式登入接 Supabase Auth。
- `packages/contracts` 保存 domain types；`packages/design-tokens` 保存官網與後台共用的色彩、字型、間距及圓角變數；官網以 `globals.css` 維持設計稿基準與 reset，互動元件的可及性樣式使用 CSS Modules（例如 `Header.module.css`）；畫面透過 repository／use case 使用資料。
- Supabase PostgreSQL 保存內容與留言，Storage 保存素材；所有表啟用 RLS。
- 開發無環境變數時使用 fixture，確保視覺任務不需等待資料庫。
