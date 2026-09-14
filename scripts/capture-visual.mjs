import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const outputDir = path.join(root, '02_規劃書', 'project', 'visual-baseline');
const baseUrl = process.env.VISUAL_BASE_URL || 'http://localhost:3000';
const headerHeight = 70;
const sections = [
  ['01', 'home', '首頁_01.png'],
  ['02', 'pricing', '首頁_02.png'],
  ['03', 'news', '首頁_03.png'],
  ['04', 'blog', '首頁_04.png'],
  ['05', 'contact', '首頁_05.png'],
];

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1672, height: 941 }, deviceScaleFactor: 1 });
await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForTimeout(1_000);
await page.evaluate(() => document.fonts?.ready);
await page.addStyleTag({ content: `
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
    caret-color: transparent !important;
  }
` });

for (const [index, sectionId, reference] of sections) {
  const section = page.locator(`#${sectionId}`);
  const box = await section.boundingBox();
  const top = Math.max(0, (box?.y ?? 0) + await page.evaluate(() => window.scrollY) - headerHeight);
  await page.evaluate((scrollTop) => window.scrollTo(0, scrollTop), top);
  await page.waitForTimeout(250);
  const output = path.join(outputDir, `current-${index}.png`);
  await page.screenshot({ path: output, fullPage: false });
  console.log(`${reference} -> ${output}`);
}
await browser.close();
