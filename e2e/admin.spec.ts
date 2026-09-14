import { test, expect } from '@playwright/test';

test('後台可登入、預覽文章並以 Escape 關閉預覽', async ({ page }) => {
  await page.goto('http://localhost:5173/articles');
  await page.getByLabel('管理員帳號').fill('admin@example.com');
  await page.getByLabel('密碼').fill('local-development-password');
  await page.getByRole('button', { name: '登入後台' }).click();
  await expect(page.getByRole('heading', { name: '最新消息與部落格' })).toBeVisible();
  await page.locator('.article-editor').getByRole('button', { name: '部落格', exact: true }).click();
  await expect(page.getByLabel('文章標題')).toHaveValue('精油的療癒力量');
  await expect(page.getByLabel('發布日期')).toHaveValue('2025-09-05');
  await page.locator('.article-editor').getByRole('button', { name: '最新消息', exact: true }).click();
  await page.getByRole('button', { name: '預覽' }).click();
  await expect(page.getByRole('dialog', { name: '文章預覽' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: '文章預覽' })).not.toBeVisible();
});

test('後台登入失敗輔助流程與登出會回到登入畫面', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByLabel('管理員帳號').fill('admin@example.com');
  await page.getByRole('button', { name: '忘記密碼？寄送重設信件' }).click();
  await expect(page.getByText(/開發模式不會寄送重設信件/)).toBeVisible();
  await page.getByLabel('密碼').fill('local-development-password');
  await page.getByRole('button', { name: '登入後台' }).click();
  await expect(page.getByRole('heading', { name: '總覽' })).toBeVisible();
  await page.getByRole('button', { name: '登出' }).click();
  await expect(page.getByRole('heading', { name: '內容管理後台' })).toBeVisible();
});

test('後台收合側欄仍保留按鈕名稱與目前頁面語意', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByLabel('管理員帳號').fill('admin@example.com');
  await page.getByLabel('密碼').fill('local-development-password');
  await page.getByRole('button', { name: '登入後台' }).click();
  const toggle = page.getByRole('button', { name: '收合選單' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('button', { name: '總覽' })).toHaveAttribute('aria-current', 'page');
  await toggle.click();
  await expect(page.getByRole('button', { name: '展開選單' })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('button', { name: '總覽' })).toHaveAttribute('aria-current', 'page');
});

test('文章正文圖片 block 可從共用素材選擇器帶入圖片', async ({ page }) => {
  await page.goto('http://localhost:5173/articles');
  await page.getByLabel('管理員帳號').fill('admin@example.com');
  await page.getByLabel('密碼').fill('local-development-password');
  await page.getByRole('button', { name: '登入後台' }).click();
  const editor = page.locator('.article-editor');
  await editor.getByRole('button', { name: '+ 圖片' }).click();
  const imageBlock = editor.locator('.body-block').last();
  await imageBlock.getByRole('button', { name: '選擇 news-1.png' }).click();
  await expect(imageBlock.locator('input').first()).toHaveValue('/assets/crops/news-1.png');
});

test('後台文章狀態篩選與手機版不溢出', async ({ page }) => {
  await page.goto('http://localhost:5173/articles');
  await page.getByLabel('管理員帳號').fill('admin@example.com');
  await page.getByLabel('密碼').fill('local-development-password');
  await page.getByRole('button', { name: '登入後台' }).click();
  await page.getByLabel('文章狀態').selectOption('draft');
  await expect(page.locator('button.list-item').filter({ hasText: '草稿' }).first()).toBeVisible();
  await expect(page.getByLabel('文章標題')).toHaveValue('內部草稿：秋季養生企劃');
  await page.setViewportSize({ width: 390, height: 844 });
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(hasHorizontalOverflow).toBe(false);
});

test('後台離開編輯頁前會提醒尚未儲存變更', async ({ page }) => {
  await page.goto('http://localhost:5173/articles');
  await page.getByLabel('管理員帳號').fill('admin@example.com');
  await page.getByLabel('密碼').fill('local-development-password');
  await page.getByRole('button', { name: '登入後台' }).click();
  await page.getByLabel('文章標題').fill('尚未儲存的測試標題');
  let dialogMessage = '';
  page.once('dialog', async (dialog) => { dialogMessage = dialog.message(); await dialog.dismiss(); });
  await page.getByRole('button', { name: /全新精油課程登場/ }).click();
  expect(dialogMessage).toContain('尚未儲存');
  await expect(page.getByLabel('文章標題')).toHaveValue('尚未儲存的測試標題');
  page.once('dialog', async (dialog) => { dialogMessage = dialog.message(); await dialog.dismiss(); });
  await page.getByRole('button', { name: '服務價格', exact: true }).click();
  expect(dialogMessage).toContain('尚未儲存');
  await expect(page.getByRole('heading', { name: '最新消息與部落格' })).toBeVisible();
});

test('後台設定可編輯品牌且素材可搜尋篩選', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByLabel('管理員帳號').fill('admin@example.com');
  await page.getByLabel('密碼').fill('local-development-password');
  await page.getByRole('button', { name: '登入後台' }).click();
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
  await page.getByLabel('管理員帳號').fill('admin@example.com');
  await page.getByLabel('密碼').fill('local-development-password');
  await page.getByRole('button', { name: '登入後台' }).click();
  await page.getByRole('button', { name: '新增', exact: true }).click();
  const editor = page.locator('.form-panel');
  await editor.getByLabel('服務名稱').fill('深層放鬆體驗');
  await editor.getByLabel('網址代稱（slug）').fill('deep-relaxation');
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
  await page.getByLabel('管理員帳號').fill('admin@example.com');
  await page.getByLabel('密碼').fill('local-development-password');
  await page.getByRole('button', { name: '登入後台' }).click();
  const editor = page.locator('.article-editor');
  await editor.getByRole('button', { name: '新增', exact: true }).click();
  await editor.getByLabel('文章標題').fill('春日放鬆指南');
  await editor.getByLabel('網址代稱（slug）').fill('spring-relax-guide');
  await editor.getByLabel('摘要').fill('用一段安靜時光照顧自己。');
  await editor.getByLabel('已發布').click();
  await expect(editor.getByLabel('已發布')).not.toBeChecked();
  await expect(editor.getByText('文章必須先提供正文內容才能發布')).toBeVisible();
  await editor.getByRole('button', { name: '+ 段落' }).click();
  await editor.locator('.body-block').last().locator('textarea').fill('春日裡留一段時間，讓身心重新呼吸。');
  await editor.getByLabel('已發布').check();
  await editor.getByRole('button', { name: '儲存' }).click();
  await expect(editor.getByText('文章已儲存')).toBeVisible();
  await expect(editor.getByRole('button', { name: /春日放鬆指南/ })).toContainText('已發布');
  await editor.getByLabel('已發布').uncheck();
  await editor.getByRole('button', { name: '儲存' }).click();
  await expect(editor.getByText('文章已儲存')).toBeVisible();
  await expect(editor.getByRole('button', { name: /春日放鬆指南/ })).toContainText('草稿');
});

test('後台刪除文章後會從編輯列表移除', async ({ page }) => {
  await page.goto('http://localhost:5173/articles');
  await page.getByLabel('管理員帳號').fill('admin@example.com');
  await page.getByLabel('密碼').fill('local-development-password');
  await page.getByRole('button', { name: '登入後台' }).click();
  const editor = page.locator('.article-editor');
  await expect(editor.getByLabel('文章標題')).toHaveValue('中秋限定優惠活動');
  page.once('dialog', (dialog) => dialog.accept());
  await editor.getByRole('button', { name: '刪除文章' }).click();
  await expect(editor.getByRole('button', { name: /中秋限定優惠活動/ })).not.toBeVisible();
  await expect(page.getByText('文章已刪除')).toBeVisible();
});

test('後台留言可篩選、保存備註並標記處理', async ({ page }) => {
  await page.goto('http://localhost:5173/messages');
  await page.getByLabel('管理員帳號').fill('admin@example.com');
  await page.getByLabel('密碼').fill('local-development-password');
  await page.getByRole('button', { name: '登入後台' }).click();
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
  await page.getByLabel('管理員帳號').fill('admin@example.com');
  await page.getByLabel('密碼').fill('local-development-password');
  await page.getByRole('button', { name: '登入後台' }).click();
  await page.getByLabel('搜尋素材').fill('service-1');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: '刪除素材' }).click();
  await expect(page.getByText(/正在使用的素材無法刪除/)).toBeVisible();

  await page.getByRole('button', { name: '最新消息與部落格', exact: true }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: '刪除 活動訊息' }).click();
  await expect(page.getByText(/^刪除失敗：使用中的分類無法刪除/)).toBeVisible();
});
