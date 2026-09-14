import { test, expect } from '@playwright/test';

test('首頁桌機與手機版可操作且沒有水平溢出', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/天心閣/);
  const skipLink = page.getByRole('link', { name: '跳到主要內容' });
  await skipLink.focus();
  await expect(skipLink).toHaveCSS('left', '16px');
  await expect(skipLink).toHaveAttribute('href', '#main-content');
  await expect(page.locator('main#main-content')).toHaveCount(1);
  await expect(page.locator('main#main-content')).toBeVisible();
  await expect(page.locator('main#main-content')).toHaveCSS('scroll-margin-top', '76px');
  await skipLink.click();
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('main-content');
  await expect(page.locator('.hero-mark')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('home-desktop.png'), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('main#main-content')).toHaveCSS('scroll-margin-top', '66px');
  await page.getByRole('button', { name: '開啟選單' }).click();
  const header = page.getByRole('banner');
  await expect(page.getByRole('button', { name: '關閉選單' })).toHaveAttribute('aria-expanded', 'true');
  await expect(header.getByRole('link', { name: '服務項目' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(header.getByRole('link', { name: '服務項目' })).not.toBeVisible();
  await page.getByRole('button', { name: '開啟選單' }).click();
  await header.getByRole('link', { name: '服務項目' }).click();
  await expect.poll(() => page.locator('#services').evaluate((element) => element.getBoundingClientRect().top), { timeout: 5000 }).toBeGreaterThanOrEqual(65);
  const firstServiceImage = page.locator('.service-card img').first();
  await firstServiceImage.evaluate((image) => { image.src = '/missing-service-image.png'; });
  await expect(page.locator('.service-card img').first()).toHaveAttribute('alt', /圖片暫缺/);
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(hasHorizontalOverflow).toBe(false);
  await page.screenshot({ path: testInfo.outputPath('home-mobile.png'), fullPage: true });

  for (const width of [390, 768, 1440, 1672]) {
    await page.setViewportSize({ width, height: 941 });
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow, `horizontal overflow at ${width}px`).toBe(false);
  }
});

test('最新消息手動輪播不會切到空白頁', async ({ page }) => {
  await page.goto('/');
  const news = page.locator('#news');
  await expect(news.locator('.article-card')).toHaveCount(3);
  const controls = news.locator('.slider-controls');
  await expect(controls).toBeVisible();
  const dots = controls.locator('button.dot');
  await expect(dots).toHaveCount(3);
  await expect(dots.nth(1)).toBeEnabled();
  await dots.nth(1).click();
  await expect(news.locator('.article-card')).toHaveCount(3);
});

test('首頁部落格分類入口跟隨已發布文章分類', async ({ page }) => {
  await page.goto('/');
  const blog = page.locator('#blog');
  const cardCategories = await blog.locator('.article-card .article-image span').allTextContents();
  const expected = [...new Set(cardCategories.map((value) => value.trim()).filter(Boolean))];
  const categoryLinks = blog.locator('.category-row a');
  await expect(categoryLinks).toHaveCount(expected.length);
  for (const category of expected) {
    await expect(categoryLinks.filter({ hasText: category })).toHaveAttribute('href', `/blog?category=${encodeURIComponent(category)}`);
  }
});

test('價格卡的預約入口都使用官方 LINE', async ({ page }) => {
  await page.goto('/');
  const bookingLinks = page.locator('#pricing .price-card a.btn');
  await expect(bookingLinks).toHaveCount(5);
  for (let index = 0; index < 5; index += 1) {
    await expect(bookingLinks.nth(index)).toHaveAttribute('href', /^https:\/\/line\.me\/ti\/p\//);
  }
});

test('內頁導覽會標示目前內容區段', async ({ page }) => {
  await page.goto('/services');
  await expect(page.getByRole('banner').getByRole('link', { name: '服務項目' })).toHaveAttribute('aria-current', 'location');
  await page.goto('/blog/healing-power-of-oils');
  await expect(page.getByRole('banner').getByRole('link', { name: '部落格' })).toHaveAttribute('aria-current', 'location');
});

test('公開文章與服務路由及 404 狀態正確', async ({ page }) => {
  await expect((await page.goto('/services/full-body'))?.status()).toBe(200);
  await page.goto('/news');
  await expect(page.getByRole('navigation', { name: '最新消息分類' })).toBeVisible();
  await page.getByRole('navigation', { name: '最新消息分類' }).getByRole('link', { name: '活動訊息', exact: true }).click();
  await expect(page).toHaveURL(/\/news\?category=%E6%B4%BB%E5%8B%95%E8%A8%8A%E6%81%AF/);
  await page.goto('/services');
  await page.locator('.inner-card img').first().evaluate((image) => { image.src = '/missing-inner-service-image.png'; });
  await expect(page.locator('.inner-card img').first()).toHaveAttribute('alt', /圖片暫缺/);
  await expect((await page.goto('/news/missing'))?.status()).toBe(404);
  await expect((await page.goto('/blog/healing-power-of-oils'))?.status()).toBe(200);
});

test('服務、文章、搜尋與政策內頁在手機版沒有水平溢出', async ({ page }) => {
  const routes = ['/services', '/services/full-body', '/news', '/news/mid-autumn-offer', '/blog', '/blog/healing-power-of-oils', '/search?q=精油', '/privacy', '/terms'];
  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of routes) {
      await page.goto(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(overflow, `horizontal overflow at ${width}px on ${route}`).toBe(false);
    }
  }
});

test('草稿不會從公開網址、搜尋或 sitemap 洩漏', async ({ page }) => {
  await expect((await page.goto('/news/internal-autumn-draft'))?.status()).toBe(404);
  await page.goto('/search?q=internal-draft');
  await expect(page.getByText('內部草稿：秋季養生企劃')).not.toBeVisible();
  const sitemap = await (await page.request.get('/sitemap.xml')).text();
  expect(sitemap).not.toContain('internal-autumn-draft');
});

test('聯絡表單成功送出後清空並顯示成功狀態', async ({ page }) => {
  await page.goto('/#contact');
  const form = page.locator('form.contact-form');
  const uniquePhone = `09${Date.now().toString().slice(-8)}`;
  const uniqueMessage = `測試留言 ${Date.now()}`;
  await form.locator('input[name="name"]').fill('測試訪客');
  await form.locator('input[name="phone"]').fill(uniquePhone);
  await form.locator('textarea[name="message"]').fill(uniqueMessage);
  await form.getByRole('button', { name: '送出訊息' }).click();
  await expect(form.getByRole('button', { name: /已送出/ })).toBeVisible();
});

test('聯絡表單失敗時保留已輸入內容', async ({ page }) => {
  await page.route('**/api/contact', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: '暫時無法儲存' }) }));
  await page.goto('/#contact');
  const form = page.locator('form.contact-form');
  await form.locator('input[name="name"]').fill('保留內容測試');
  await form.locator('input[name="phone"]').fill('0911222333');
  await form.locator('textarea[name="message"]').fill('失敗時應保留這段留言');
  await form.getByRole('button', { name: '送出訊息' }).click();
  await expect(form.locator('.form-error')).toBeVisible();
  await expect(form.locator('input[name="name"]')).toHaveValue('保留內容測試');
  await expect(form.locator('input[name="phone"]')).toHaveValue('0911222333');
  await expect(form.locator('textarea[name="message"]')).toHaveValue('失敗時應保留這段留言');
});
