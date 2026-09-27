import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const origin = process.env.PERF_ORIGIN || 'https://tiancinge-web.web.app';
const routes = (process.env.PERF_ROUTES || '/,/services,/news,/blog').split(',').map((value) => value.trim()).filter(Boolean);
const runs = Math.max(3, Number(process.env.PERF_RUNS || 3));
const output = resolve(process.argv[2] || '../02_規劃書/update/2026-09-18-seo-architecture/evidence/lighthouse-mobile-2026-09-20.json');
const temp = resolve('/tmp', `txg-lighthouse-${process.pid}`);

function median(values) {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

await mkdir(temp, { recursive: true });
const samples = [];
try {
  for (const route of routes) {
    for (let run = 1; run <= runs; run += 1) {
      const reportPath = resolve(temp, `${routes.indexOf(route)}-${run}.json`);
      execFileSync('pnpm', ['dlx', 'lighthouse', new URL(route, origin).toString(), '--quiet', '--preset=perf', '--form-factor=mobile', '--output=json', `--output-path=${reportPath}`, '--chrome-flags=--headless --no-sandbox'], { stdio: 'inherit' });
      const report = JSON.parse(await readFile(reportPath, 'utf8'));
      const resourceItems = report.audits['resource-summary']?.details?.items || [];
      const resourceBytes = (type) => resourceItems.find((item) => String(item.resourceType || '').toLowerCase() === type.toLowerCase())?.transferSize ?? null;
      samples.push({
        route,
        run,
        lcpMs: report.audits['largest-contentful-paint']?.numericValue ?? null,
        cls: report.audits['cumulative-layout-shift']?.numericValue ?? null,
        tbtMs: report.audits['total-blocking-time']?.numericValue ?? null,
        jsBytes: resourceBytes('Script'),
        imageBytes: resourceBytes('Image'),
        performanceScore: report.categories.performance?.score == null ? null : report.categories.performance.score * 100,
      });
    }
  }
} finally {
  await rm(temp, { recursive: true, force: true });
}

const summary = routes.map((route) => {
  const rows = samples.filter((sample) => sample.route === route);
  return { route, runs: rows.length, median: Object.fromEntries(['performanceScore', 'lcpMs', 'cls', 'tbtMs', 'jsBytes', 'imageBytes'].map((field) => [field, median(rows.map((row) => row[field]))])) };
});
const report = { origin, preset: 'perf', formFactor: 'mobile', runs, measuredAt: new Date().toISOString(), summary, samples };
await mkdir(resolve(output, '..'), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ output, summary }, null, 2));
