import { cp, mkdtemp, readFile, rm, symlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { prepareStaticRelease } from './static-release.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [, , snapshotPath, outputPath] = process.argv;
if (!snapshotPath || !outputPath) throw new Error('Usage: node scripts/build-static-site.mjs <private-snapshot.json> <output-dir>');
const snapshot = resolve(snapshotPath);
const output = resolve(outputPath);
if (!existsSync(snapshot)) throw new Error('Public snapshot does not exist');
// Keep the isolated tree below the repository. Turbopack intentionally rejects
// dependency symlinks that escape its project root.
const work = await mkdtemp(resolve(root, 'apps/.static-build-'));
const source = resolve(root, 'apps/web');

function run(command, args, options) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolveRun() : reject(new Error(`${command} exited with ${code}`)));
  });
}

try {
  // A static export cannot include mutating Route Handlers. The production API
  // build remains in apps/web; this isolated build contains public pages only.
  await cp(source, work, { recursive: true, filter: (entry) => !/\/(node_modules|\.next|out|api)(\/|$)/.test(entry) && !/\/src\/app\/error\.tsx$/.test(entry) });
  // pnpm keeps this package's Next.js symlink under apps/web/node_modules.
  // Link it into the isolated source tree rather than copying a dependency
  // directory into every content build.
  await symlink(resolve(source, 'node_modules'), resolve(work, 'node_modules'), 'dir');
  // Turbopack currently rejects this intentionally symlinked isolated tree;
  // use the stable webpack exporter for release artifacts.
  await run(process.execPath, [resolve(source, 'node_modules/next/dist/bin/next'), 'build', '--webpack', ...(process.env.DEBUG_STATIC_BUILD === '1' ? ['--debug-prerender'] : [])], {
    cwd: work,
    env: { ...process.env, STATIC_EXPORT: '1', PUBLIC_SNAPSHOT_PATH: snapshot, NEXT_TELEMETRY_DISABLED: '1' },
  });
  await rm(output, { recursive: true, force: true });
  await cp(resolve(work, 'out'), output, { recursive: true, force: true });
  // These entries exist only because Next requires one static parameter for an
  // otherwise empty dynamic route. They must never be served or indexed.
  await Promise.all([
    'services/zzzzzzzzzz', 'news/zzzzzzzzzz', 'blog/zzzzzzzzzz',
    'news/category/__placeholder__', 'blog/category/__placeholder__',
    'news/page/1', 'blog/page/1',
  ].flatMap((path) => [rm(resolve(output, path), { recursive: true, force: true }), rm(resolve(output, `${path}.html`), { force: true }), rm(resolve(output, `${path}.txt`), { force: true })]));
  const sourceSnapshot = JSON.parse(await readFile(snapshot, 'utf8'));
  const release = await prepareStaticRelease(output, sourceSnapshot);
  process.stdout.write(`${JSON.stringify({ release: { digest: release.sitemapSha256, urls: release.urls.length } })}\n`);
} finally {
  if (process.env.KEEP_STATIC_BUILD !== '1') await rm(work, { recursive: true, force: true });
}
