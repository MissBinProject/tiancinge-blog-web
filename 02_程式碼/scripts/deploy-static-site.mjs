import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { buildStaticHostingConfig } from './static-hosting-config.mjs';

const require = createRequire(new URL('../apps/sitemap-worker/package.json', import.meta.url));
const { GoogleAuth } = require('google-auth-library');

const [, , artifactPath, snapshotPath] = process.argv;
if (!artifactPath || !snapshotPath) throw new Error('Usage: node scripts/deploy-static-site.mjs <static-artifact-dir> <private-snapshot.json>');
const project = 'tiancinge'; const site = 'tiancinge-web'; const channel = `static-${randomUUID().slice(0, 8)}`;
const root = resolve('.'); const artifact = resolve(artifactPath); const target = resolve(root, 'build/static-web');
const snapshot = JSON.parse(await readFile(resolve(snapshotPath), 'utf8'));
if (!/^[a-f0-9]{64}$/i.test(snapshot.digest || '')) throw new Error('Snapshot digest missing or invalid');
const digest = createHash('sha256').update(await readFile(resolve(artifact, 'sitemap.xml'))).digest('hex');
if (!digest) throw new Error('Static artifact does not contain sitemap.xml');
if ((await readFile(resolve(artifact, 'sitemap_v2.xml'), 'utf8')) !== (await readFile(resolve(artifact, 'sitemap.xml'), 'utf8'))) throw new Error('sitemap_v2.xml must match sitemap.xml');
const sitemapUrlCount = (await readFile(resolve(artifact, 'sitemap.xml'), 'utf8')).match(/<url>/g)?.length || 0;
if (!Number.isSafeInteger(sitemapUrlCount) || sitemapUrlCount < 1 || sitemapUrlCount > 50_000) throw new Error('Static artifact sitemap URL count is invalid');
const command = (binary, args, options = {}) => execFileSync(binary, args, { encoding: 'utf8', ...options });
async function metadataToken(audience) {
  const url = audience ? `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=${encodeURIComponent(audience)}` : 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token';
  const response = await fetch(url, { headers: { 'Metadata-Flavor': 'Google' }, signal: AbortSignal.timeout(2000) });
  if (!response.ok) throw new Error('metadata token unavailable');
  const body = audience ? await response.text() : await response.json();
  return audience ? body : body.access_token;
}
async function token(kind, audience) {
  try { return await metadataToken(kind === 'identity' ? audience : undefined); } catch {}
  try {
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    if (kind === 'identity') {
      const headers = await (await auth.getIdTokenClient(audience)).getRequestHeaders();
      return headers.Authorization.replace(/^Bearer\s+/i, '');
    }
    return await auth.getAccessToken();
  } catch {}
  return command('gcloud', ['auth', kind === 'identity' ? 'print-identity-token' : 'print-access-token']).trim();
}
async function api(url, method = 'GET', body) {
  const worker = url.includes('tiancinge-sitemap') || url.includes('/deploy-static');
  const credential = await token(worker ? 'identity' : 'access', worker ? new URL(url).origin : undefined);
  const response = await fetch(url, { method, headers: { Authorization: `Bearer ${credential}`, 'Content-Type': 'application/json', 'x-goog-user-project': project }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Request failed: ${response.status} ${new URL(url).pathname}`);
  return response.json();
}

await rm(target, { recursive: true, force: true }); await mkdir(target, { recursive: true }); await cp(artifact, target, { recursive: true });
const baseConfig = JSON.parse(await readFile(resolve(root, 'firebase.static.json'), 'utf8'));
const releaseConfigPath = resolve(root, `.firebase.static.release-${channel}.json`);
await writeFile(releaseConfigPath, JSON.stringify(buildStaticHostingConfig(baseConfig, snapshot), null, 2));
try {
  command(process.env.FIREBASE_BIN || 'firebase', ['hosting:channel:deploy', channel, '--only', 'web', '--config', releaseConfigPath, '--project', project, '--expires', '1d', '--non-interactive'], { stdio: 'inherit' });
} finally {
  await rm(releaseConfigPath, { force: true });
}
const staged = await api(`https://firebasehosting.googleapis.com/v1beta1/sites/${site}/channels/${channel}`);
const candidateVersion = staged.release?.version?.name;
if (!candidateVersion) throw new Error('Static staging did not return a version');
const workerUrl = process.env.SITEMAP_WORKER_URL?.trim() || command('gcloud', ['run', 'services', 'describe', 'tiancinge-sitemap', '--project', project, '--region', 'asia-east1', '--format=value(status.url)']).trim();
if (process.env.STATIC_STAGE_ONLY === '1') {
  process.stdout.write(`靜態候選版本已建立（未發布）：${candidateVersion}，sitemap=${digest.slice(0, 12)}。\\n`);
  process.exit(0);
}
const queued = await api(`${workerUrl}/deploy-static`, 'POST', { candidateVersion, snapshotDigest: snapshot.digest, sitemapUrlCount });
process.stdout.write(`靜態候選版本已排入發布佇列，序號 ${queued.sequence}，sitemap=${digest.slice(0, 12)}。\n`);
