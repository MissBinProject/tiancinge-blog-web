import { test, expect, type Page } from '@playwright/test';

const e2eAdminUsername = process.env.E2E_ADMIN_USERNAME || 'tiancinge';
const e2eAdminPassword = process.env.E2E_ADMIN_PASSWORD;

test.beforeEach(() => {
  test.skip(!e2eAdminPassword, '設定 E2E_ADMIN_PASSWORD 才會執行後台端對端測試；帳號預設為 tiancinge');
});

async function login(page: Page) {
  await page.getByLabel('管理員帳號').fill(e2eAdminUsername);
  await page.getByLabel('密碼').fill(e2eAdminPassword!);
  await page.getByRole('button', { name: '登入後台' }).click();
}

test('部落格先顯示文章清單，點擊編輯後才顯示編輯器與預覽', async ({ page }) => {
  await page.goto('http://localhost:5173/blog');
  await login(page);
  await expect(page.getByRole('heading', { name: '部落格文章管理' })).toBeVisible();
  await expect(page.getByLabel('文章標題')).not.toBeVisible();
  await expect(page.getByText('中秋限定優惠活動')).not.toBeVisible();
  await page.getByRole('button', { name: '編輯 精油的療癒力量' }).click();
  await expect(page.getByLabel('文章標題')).toHaveValue('精油的療癒力量');
  await expect(page.getByLabel('發布日期')).toHaveValue('2025-09-05');
  await page.getByRole('button', { name: '預覽' }).click();
  await expect(page.getByRole('dialog', { name: '文章預覽' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: '文章預覽' })).not.toBeVisible();
});

test('後台登入失敗輔助流程與登出會回到登入畫面', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByLabel('管理員帳號').fill(e2eAdminUsername);
  await page.getByRole('button', { name: '需要重設密碼？' }).click();
  await expect(page.getByText('請聯絡網站維護者重設管理員密碼。')).toBeVisible();
  await page.getByLabel('密碼').fill(e2eAdminPassword!);
  await page.getByRole('button', { name: '登入後台' }).click();
  await expect(page.getByRole('heading', { name: '總覽' })).toBeVisible();
  await page.getByRole('button', { name: '登出' }).click();
  await expect(page.getByRole('heading', { name: '內容管理後台' })).toBeVisible();
});

test('後台收合側欄仍保留按鈕名稱與目前頁面語意', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await login(page);
  const toggle = page.getByRole('button', { name: '收合選單' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('button', { name: '總覽' })).toHaveAttribute('aria-current', 'page');
  await toggle.click();
  await expect(page.getByRole('button', { name: '展開選單' })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('button', { name: '總覽' })).toHaveAttribute('aria-current', 'page');
});

test('文章正文圖片 block 可從共用素材選擇器帶入圖片', async ({ page }) => {
  await page.goto('http://localhost:5173/news');
  await login(page);
  await page.getByRole('button', { name: '編輯 中秋限定優惠活動' }).click();
  const editor = page.locator('.article-edit-page');
  await editor.getByLabel('插入已上傳圖片').selectOption({ label: 'news-1.png' });
  await expect(editor.locator('.ProseMirror img').last()).toHaveAttribute('src', 'https://tiancinge-web.web.app/assets/crops/news-1.png');
});

test('後台文章狀態篩選與手機版不溢出', async ({ page }) => {
  await page.goto('http://localhost:5173/articles');
  await login(page);
  await page.getByLabel('文章狀態').selectOption('draft');
  await expect(page.getByRole('button', { name: '編輯 內部草稿：秋季養生企劃' })).toBeVisible();
  await expect(page.getByLabel('文章標題')).not.toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(hasHorizontalOverflow).toBe(false);
});

test('後台主要模組在手機版沒有水平溢出', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:5173/');
  await login(page);
  await expect(page.getByRole('heading', { name: '總覽' })).toBeVisible();

  for (const route of ['/', '/services', '/articles', '/media', '/messages', '/settings']) {
    await page.goto(`http://localhost:5173${route}`);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), { timeout: 5000 }).toBe(false);
  }
});

test('後台離開編輯頁前會提醒尚未儲存變更', async ({ page }) => {
  await page.goto('http://localhost:5173/articles');
  await login(page);
  await page.getByRole('button', { name: '編輯 中秋限定優惠活動' }).click();
  await page.getByLabel('文章標題').fill('尚未儲存的測試標題');
  let dialogMessage = '';
  page.once('dialog', async (dialog) => { dialogMessage = dialog.message(); await dialog.dismiss(); });
  await page.getByRole('button', { name: /返回最新消息清單/ }).click();
  expect(dialogMessage).toContain('尚未儲存');
  await expect(page.getByLabel('文章標題')).toHaveValue('尚未儲存的測試標題');
  page.once('dialog', async (dialog) => { dialogMessage = dialog.message(); await dialog.dismiss(); });
  await page.getByRole('button', { name: '服務價格', exact: true }).click();
  expect(dialogMessage).toContain('尚未儲存');
  await expect(page.getByRole('heading', { name: '文章管理' })).toBeVisible();
});

test('後台設定可編輯品牌且素材可搜尋篩選', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await login(page);
  await page.getByRole('button', { name: '網站設定', exact: true }).click();
  await expect(page.getByLabel('品牌名稱')).toHaveValue('天心閣養生會館');
  await page.getByRole('button', { name: '素材管理', exact: true }).click();
  await page.getByLabel('搜尋素材').fill('service-1');
  await expect(page.getByText('service-1.png')).toBeVisible();
  await expect(page.getByText('285 × 125px')).toBeVisible();
  await expect(page.getByText('service-2.png')).not.toBeVisible();
});

test('後台可新增服務並保存排序與顯示狀態', async ({ page }) => {
  await page.goto('http://localhost:5173/services');
  await login(page);
  await page.getByRole('button', { name: '新增', exact: true }).click();
  const editor = page.locator('.form-panel');
  await editor.getByLabel('服務名稱').fill('深層放鬆體驗');
  await expect(editor.getByLabel('系統代碼（10 位亂碼，不可修改）')).toHaveValue(/^[a-z0-9]{10}$/);
  await editor.getByLabel('卡片摘要').fill('沉浸式放鬆・找回平衡');
  await editor.getByLabel('介紹內容').fill('專業手技陪伴你放下日常壓力。');
  await editor.getByLabel('排序').fill('6');
  await editor.getByLabel('顯示於官網').check();
  await editor.getByRole('button', { name: '儲存' }).click();
  await expect(editor.getByText('服務已儲存')).toBeVisible();
  await expect(page.getByRole('button', { name: /深層放鬆體驗/ })).toBeVisible();
});

test('後台可建立草稿文章並發布', async ({ page }) => {
  await page.goto('http://localhost:5173/articles');
  await login(page);
  const list = page.locator('.article-list-page');
  await list.getByRole('button', { name: '新增文章' }).click();
  const editor = page.locator('.article-edit-page');
  await editor.getByLabel('文章標題').fill('春日放鬆指南');
  await expect(editor.getByLabel('網址代稱（slug）')).toHaveValue(/^[a-z0-9]{10}$/);
  await editor.getByLabel('摘要').fill('用一段安靜時光照顧自己。');
  await editor.getByLabel('已發布').click();
  await expect(editor.getByLabel('已發布')).not.toBeChecked();
  await expect(editor.getByText('文章必須先提供正文內容才能發布')).toBeVisible();
  await editor.locator('.ProseMirror').click();
  await editor.locator('.ProseMirror').fill('春日裡留一段時間，讓身心重新呼吸。');
  await editor.getByLabel('已發布').check();
  await editor.getByRole('button', { name: '儲存' }).click();
  await expect(editor.getByText('文章已儲存')).toBeVisible();
  await editor.getByRole('button', { name: /返回最新消息清單/ }).click();
  await expect(page.getByRole('button', { name: '編輯 春日放鬆指南' })).toBeVisible();
  await page.getByRole('button', { name: '編輯 春日放鬆指南' }).click();
  await editor.getByLabel('已發布').uncheck();
  await editor.getByRole('button', { name: '儲存' }).click();
  await expect(editor.getByText('文章已儲存')).toBeVisible();
  await editor.getByRole('button', { name: /返回最新消息清單/ }).click();
  await expect(page.getByText('春日放鬆指南')).toBeVisible();
});

test('後台刪除文章後會從編輯列表移除', async ({ page }) => {
  await page.goto('http://localhost:5173/articles');
  await login(page);
  await page.getByRole('button', { name: '編輯 中秋限定優惠活動' }).click();
  const editor = page.locator('.article-edit-page');
  await expect(editor.getByLabel('文章標題')).toHaveValue('中秋限定優惠活動');
  page.once('dialog', (dialog) => dialog.accept());
  await editor.getByRole('button', { name: '刪除文章' }).click();
  await expect(page.getByRole('button', { name: '編輯 中秋限定優惠活動' })).not.toBeVisible();
});

test('後台留言可篩選、保存備註並標記處理', async ({ page }) => {
  await page.goto('http://localhost:5173/messages');
  await login(page);
  await expect(page.getByText('王小姐 的留言')).toBeVisible();
  await page.getByLabel('內部備註').fill('已回覆預約資訊');
  await page.getByRole('button', { name: '儲存備註' }).click();
  await expect(page.getByText('內部備註已儲存')).toBeVisible();
  await page.getByRole('button', { name: '標記已處理' }).click();
  await expect(page.getByText('留言已標記處理')).toBeVisible();
  await page.getByRole('button', { name: '已處理', exact: true }).click();
  await expect(page.getByRole('button', { name: /王小姐/ })).toBeVisible();
});

test('後台拒絕刪除使用中的素材與分類', async ({ page }) => {
  await page.goto('http://localhost:5173/media');
  await login(page);
  await page.getByLabel('搜尋素材').fill('service-1');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: '刪除素材' }).click();
  await expect(page.getByText(/正在使用的素材無法刪除/)).toBeVisible();

  await page.getByRole('button', { name: '最新消息', exact: true }).first().click();
  await page.getByRole('button', { name: '編輯分類' }).click();
  await page.getByRole('button', { name: '刪除 活動訊息' }).click();
  await expect(page.getByText('使用中的分類無法刪除', { exact: true })).toBeVisible();
});

test('文章編輯器提供字體、字級、顏色與完整格式工具', async ({ page }) => {
  await page.goto('http://localhost:5173/blog');
  await login(page);
  await page.getByRole('button', { name: '編輯 精油的療癒力量' }).click();
  const toolbar = page.getByRole('toolbar', { name: '文章格式工具列' });
  await expect(toolbar.getByLabel('字體')).toBeVisible();
  await expect(toolbar.getByLabel('文字大小')).toBeVisible();
  await expect(toolbar.getByLabel('文字顏色')).toBeVisible();
  await expect(toolbar.getByRole('button', { name: '底線' })).toBeVisible();
  await expect(toolbar.getByRole('button', { name: '置中對齊' })).toBeVisible();
  await expect(toolbar.getByRole('button', { name: '編號清單' })).toBeVisible();
  await page.locator('.ProseMirror h2').click({ clickCount: 3 });
  await toolbar.getByLabel('文字大小').selectOption('24px');
  await toolbar.getByRole('button', { name: '粗體' }).click();
  await toolbar.getByRole('button', { name: '置中對齊' }).click();
  await expect(page.locator('.ProseMirror h2')).toHaveCSS('text-align', 'center');
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: '預覽' }).click();
  const previewHeading = page.locator('.preview-body h2');
  await expect(previewHeading).toHaveCSS('text-align', 'center');
  await expect(previewHeading.locator('span[style*="font-size: 24px"]').first()).toBeVisible();
});

test('分類管理預設隱藏，開啟後只顯示部落格分類', async ({ page }) => {
  await page.goto('http://localhost:5173/blog');
  await login(page);
  await expect(page.getByRole('heading', { name: '部落格分類管理' })).not.toBeVisible();
  await page.getByRole('button', { name: '編輯分類' }).click();
  await expect(page.getByRole('heading', { name: '部落格分類管理' })).toBeVisible();
  await expect(page.getByText('養生知識')).toBeVisible();
  await expect(page.getByText('活動訊息')).not.toBeVisible();
});
