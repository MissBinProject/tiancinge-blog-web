import { test, expect } from '@playwright/test';

const testPassword = process.env.E2E_ADMIN_PASSWORD || 'development-password';

test('登入畫面使用一般帳號並拒絕未知帳號', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  const username = page.getByLabel('管理員帳號');
  await expect(username).toHaveAttribute('type', 'text');
  await username.fill('unknown-account');
  await page.getByLabel('密碼').fill('password123');
  await page.getByRole('button', { name: '登入後台' }).click();
  await expect(page.getByRole('alert')).toHaveText('帳號或密碼不正確');
});

test('開發模式可用 tiancinge 帳號進入後台', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByLabel('管理員帳號').fill('tiancinge');
  await page.getByLabel('密碼').fill(testPassword);
  await page.getByRole('button', { name: '登入後台' }).click();
  await expect(page.getByRole('heading', { name: '總覽' })).toBeVisible();
});

test('未知帳號的重設密碼回應不洩漏帳號存在狀態', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByLabel('管理員帳號').fill('unknown-account');
  await page.getByRole('button', { name: '忘記密碼？寄送重設信件' }).click();
  await expect(page.locator('small[role="status"]')).toHaveText(/若帳號有效/);
  await expect(page.getByText('ouyangtaisen@gmail.com')).not.toBeVisible();
});
