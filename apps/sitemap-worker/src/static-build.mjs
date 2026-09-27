const buildCommand = (workerUrl, stageOnly) => `
corepack enable
pnpm install --frozen-lockfile --ignore-scripts
mkdir -p /workspace/.private /workspace/.firebase-tools
node scripts/export-public-snapshot.mjs /workspace/.private/public-snapshot.json
pnpm build:web:static /workspace/.private/public-snapshot.json /workspace/static-artifact
npm install --prefix /workspace/.firebase-tools firebase-tools@14.17.0
FIREBASE_BIN=/workspace/.firebase-tools/node_modules/.bin/firebase \\
SITEMAP_WORKER_URL="${workerUrl}" \\
STATIC_STAGE_ONLY="${stageOnly}" \\
node scripts/deploy-static-site.mjs /workspace/static-artifact /workspace/.private/public-snapshot.json
`.trim();

/**
 * Cloud Build's REST create endpoint validates build steps before it fetches a
 * storage source. Keep this request contract alongside the worker and mirror
 * it in cloudbuild.yaml for manual inspection.
 */
export function staticBuildRequest({ source, serviceAccount, workerUrl, stageOnly = '1' }) {
  if (!source?.bucket || !source?.object || !serviceAccount || !workerUrl) throw new Error('Incomplete static build request');
  return {
    source: { storageSource: source },
    serviceAccount,
    steps: [{
      name: 'node:22-bookworm',
      id: 'build-static-site',
      entrypoint: 'bash',
      args: ['-ceu', buildCommand(workerUrl, stageOnly)],
    }],
    timeout: '1200s',
    options: { logging: 'CLOUD_LOGGING_ONLY' },
  };
}
