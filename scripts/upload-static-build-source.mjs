import { createHash } from 'node:crypto';
import { readFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { basename, resolve } from 'node:path';

const project = process.env.GOOGLE_CLOUD_PROJECT || 'tiancinge';
const bucket = process.env.STATIC_BUILD_SOURCE_BUCKET || 'tiancinge_asia-east1_cloudbuild';
const root = resolve('.');
const archive = resolve('/tmp', `tiancinge-static-source-${process.pid}.tar.gz`);
const command = (binary, args) => execFileSync(binary, args, { cwd: root, encoding: 'utf8' });

try {
  command('tar', [
    '--create', '--gzip', '--file', archive,
    '--exclude=.git', '--exclude=node_modules', '--exclude=.next', '--exclude=out', '--exclude=build',
    '--exclude=.firebase', '--exclude=.env', '--exclude=.env.*', '--exclude=*.pem', '--exclude=*.key',
    '.firebaserc', 'firebase.static.json', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml',
    'cloudbuild.yaml', 'apps/web', 'apps/sitemap-worker', 'packages', 'scripts',
  ]);
  const digest = createHash('sha256').update(await readFile(archive)).digest('hex');
  const object = `static-site/source-${digest}.tar.gz`;
  command('gcloud', ['storage', 'cp', archive, `gs://${bucket}/${object}`, '--project', project, '--quiet']);
  const generation = command('gcloud', ['storage', 'objects', 'describe', `gs://${bucket}/${object}`, '--project', project, '--format=value(generation)']).trim();
  if (!/^\d+$/.test(generation)) throw new Error('Uploaded source generation was not returned');
  process.stdout.write(`${JSON.stringify({ bucket, object, generation, digest })}\n`);
} finally {
  await rm(archive, { force: true });
}
