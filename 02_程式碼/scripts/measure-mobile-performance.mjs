import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, devices } from '@playwright/test';

const origin = process.env.PERF_ORIGIN || 'https://tiancinge-web.web.app';
const routes = (process.env.PERF_ROUTES || '/,/services,/news,/blog').split(',').map((value) => value.trim()).filter(Boolean);
const runs = Math.max(3, Number(process.env.PERF_RUNS || 3));
const output = process.argv[2] || '../02_規劃書/update/2026-09-18-seo-architecture/evidence/mobile-performance-2026-09-20.json';

function median(values) {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const samples = [];
try {
  for (const route of routes) {
    for (let run = 1; run <= runs; run += 1) {
      const context = await browser.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
      const page = await context.newPage();
      await page.addInitScript(() => {
        window.__txgVitals = { lcp: [], cls: 0, longTasks: 0 };
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          if (last) window.__txgVitals.lcp.push(last.startTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) window.__txgVitals.cls += entry.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) window.__txgVitals.longTasks += Math.max(0, entry.duration - 50);
        }).observe({ type: 'longtask', buffered: true });
      });
      const startedAt = Date.now();
      await page.goto(new URL(route, origin).toString(), { waitUntil: 'networkidle', timeout: 60_000 });
      await page.waitForTimeout(1000);
      const metrics = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        return {
          lcpMs: window.__txgVitals.lcp.at(-1) ?? null,
          cls: window.__txgVitals.cls,
          tbtMs: window.__txgVitals.longTasks,
          jsBytes: resources.filter((entry) => entry.initiatorType === 'script').reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
          imageBytes: resources.filter((entry) => entry.initiatorType === 'img' || entry.initiatorType === 'image').reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
          resourceCount: resources.length,
        };
      });
      samples.push({ route, run, elapsedMs: Date.now() - startedAt, ...metrics });
      await context.close();
    }
  }
} finally {
  await browser.close();
}

const summary = routes.map((route) => {
  const rows = samples.filter((sample) => sample.route === route);
  return {
    route,
    runs: rows.length,
    median: Object.fromEntries(['lcpMs', 'cls', 'tbtMs', 'jsBytes', 'imageBytes', 'resourceCount', 'elapsedMs'].map((field) => [field, median(rows.map((row) => row[field]))])),
  };
});
const report = { origin, device: 'iPhone 13 emulation (390px viewport)', runs, measuredAt: new Date().toISOString(), summary, samples };
const target = resolve(output);
await mkdir(resolve(target, '..'), { recursive: true });
await writeFile(target, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ output: target, routes: routes.length, runs, summary }, null, 2));
