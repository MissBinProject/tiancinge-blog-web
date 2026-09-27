import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

const project = 'tiancinge';
const site = 'tiancinge-web';
const channel = `queued-${randomUUID().slice(0, 8)}`;
const command = (binary, args, options = {}) => execFileSync(binary, args, { encoding: 'utf8', ...options });
const workerUrl = command('gcloud', ['run', 'services', 'describe', 'tiancinge-sitemap', '--project', project, '--region', 'asia-east1', '--format=value(status.url)']).trim();
async function api(url, method = 'GET', body) {
  const token = command('gcloud', ['auth', url.startsWith(workerUrl) ? 'print-identity-token' : 'print-access-token']).trim();
  const response = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'x-goog-user-project': project }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Request failed: ${response.status} ${new URL(url).pathname}`);
  return response.json();
}
const versionFlag = process.argv.indexOf('--version');
let candidateVersion;
if (versionFlag !== -1) {
  candidateVersion = process.argv[versionFlag + 1];
  if (!new RegExp(`^sites/${site}/versions/[a-zA-Z0-9_-]+$`).test(candidateVersion || '')) throw new Error('Invalid rollback version');
} else {
  // Stage immutable assets; only the worker is allowed to release them to live.
  command('firebase', ['hosting:channel:deploy', channel, '--only', 'web', '--project', project, '--expires', '1d', '--non-interactive'], { stdio: 'inherit', env: { ...process.env, SITEMAP_STAGING: '1' } });
  const staged = await api(`https://firebasehosting.googleapis.com/v1beta1/sites/${site}/channels/${channel}`);
  candidateVersion = staged.release?.version?.name;
}
if (!candidateVersion) throw new Error('Staging did not return a version');
const queued = await api(`${workerUrl}/deploy`, 'POST', { candidateVersion });
console.log(`發布已排入佇列，序號 ${queued.sequence}。正在等候 Hosting 確認…`);
for (let attempt = 0; attempt < 60; attempt++) {
  const live = await api(`https://firebasehosting.googleapis.com/v1beta1/sites/${site}/channels/live`);
  const version = await api(`https://firebasehosting.googleapis.com/v1beta1/${live.release.version.name}`);
  const sequence = Number(version.labels?.['web-sequence'] || 0);
  if (sequence >= queued.sequence) {
    console.log(sequence === queued.sequence ? `發布成功：https://${site}.web.app/` : '已有更新的發布完成，本次版本已被取代。');
    process.exit(0);
  }
  await delay(5000);
}
throw new Error('發布尚未確認完成，請查看 worker /status 與 Cloud Tasks；不要改用直接部署繞過佇列。');
