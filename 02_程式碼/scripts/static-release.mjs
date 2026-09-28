import { createHash } from 'node:crypto';
import { readFile, writeFile, lstat, access } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildSitemap, robots, SITE_ORIGIN } from '../apps/sitemap-worker/src/document.mjs';

// Input is the sitemap worker's PUBLIC metadata projection, not raw Firestore
// exports. The renderer must use the same immutable content snapshot.
export async function prepareStaticRelease(directory, source, now = new Date()) {
  const root = resolve(directory);
  const { xml, urls } = buildSitemap(source, now);
  const files = [];
  for (const { url } of urls) {
    const pathname = decodeURIComponent(new URL(url).pathname);
    const relativePath = pathname === '/' ? 'index.html' : `.${pathname}.html`;
    const directoryPath = resolve(root, `.${pathname}`, 'index.html');
    let file = resolve(root, relativePath);
    try { await access(file); } catch { file = directoryPath; }
    if (!relative(root, file) || relative(root, file).startsWith(`..${sep}`)) throw new Error(`Unsafe route: ${url}`);
    // Reject symlinked ancestors as well as symlinked HTML files.
    let current = root;
    for (const part of ['', ...relative(root, file).split(sep)]) {
      current = resolve(current, part);
      if ((await lstat(current)).isSymbolicLink()) throw new Error(`Symlink in artifact: ${url}`);
    }
    const html = await readFile(file, 'utf8');
    if (!/<html[\s>]/i.test(html) || !/<title>[^<]+<\/title>/i.test(html)
      || !/<main[\s>][\s\S]*?<\/main>/i.test(html)) throw new Error(`Incomplete HTML: ${url}`);
    const canonical = [...html.matchAll(/<link\b[^>]*>/gi)].find(([tag]) => /\brel=["']canonical["']/i.test(tag))?.[0];
    const href = canonical?.match(/\bhref=["']([^"']+)["']/i)?.[1]?.replaceAll('&amp;', '&');
    if (href !== url) throw new Error(`Canonical mismatch: ${url}`);
    if (!/<meta\b[^>]*name=["']description["'][^>]*content=["'][^"']+["']/i.test(html)
      && !/<meta\b[^>]*content=["'][^"']+["'][^>]*name=["']description["']/i.test(html)) throw new Error(`Missing description: ${url}`);
    if (/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) throw new Error(`Indexable route is noindex: ${url}`);
    files.push({ path: relative(root, file).split(sep).join('/'), sha256: createHash('sha256').update(html).digest('hex') });
  }
  // Run after export, before uploading a candidate; never patch the live site.
  await writeFile(resolve(root, 'sitemap.xml'), xml);
  await writeFile(resolve(root, 'sitemap_v2.xml'), xml);
  // Controlled format/path comparison: always use the exact same public snapshot.
  await writeFile(resolve(root, 'sitemap-diagnostic.txt'), urls.map(({ url }) => url).join('\n') + '\n');
  await writeFile(resolve(root, 'robots.txt'), robots);
  return { schemaVersion: 1, renderMode: 'static', origin: SITE_ORIGIN, generatedAt: now.toISOString(), urls, files,
    sitemapSha256: createHash('sha256').update(xml).digest('hex') };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [, , output, publicMetadata] = process.argv;
  if (!output || !publicMetadata) throw new Error('Usage: node scripts/static-release.mjs <export-dir> <public-metadata.json>');
  const result = await prepareStaticRelease(output, JSON.parse(await readFile(publicMetadata, 'utf8')));
  // Keep this build report outside Hosting public output.
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
