import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleAuth } from 'google-auth-library';
import { loadSource } from './source.mjs';
import { buildSitemap } from './document.mjs';
import { publishSitemap, publishStaticSite } from './hosting.mjs';
import { googleApi } from './google-api.mjs';
import { enqueue, refreshTask } from './queue.mjs';
import { staticBuildRequest } from './static-build.mjs';
import { publishDueScheduledArticles } from './scheduled-publications.mjs';
import { recordReleaseLog, releaseLogFromResult } from './release-log.mjs';

const project = process.env.GOOGLE_CLOUD_PROJECT || 'tiancinge';
const site = process.env.HOSTING_SITE || 'tiancinge-web';
const region = process.env.TASK_REGION || 'asia-east1';
const queue = process.env.TASK_QUEUE || 'sitemap-publish';
const workerUrl = process.env.WORKER_URL;
const invoker = process.env.TASK_INVOKER;
const releaseMode = process.env.PUBLIC_RELEASE_MODE || 'legacy-sitemap';
const staticBuildSourceBucket = process.env.STATIC_BUILD_SOURCE_BUCKET;
const staticBuildSourceObject = process.env.STATIC_BUILD_SOURCE_OBJECT;
const staticBuildSourceGeneration = process.env.STATIC_BUILD_SOURCE_GENERATION;
const staticBuildServiceAccount = process.env.STATIC_BUILD_SERVICE_ACCOUNT || `projects/${project}/serviceAccounts/tiancinge-cloudbuild@${project}.iam.gserviceaccount.com`;
const staticBuildStageOnly = process.env.STATIC_BUILD_STAGE_ONLY || '1';
if (!workerUrl || !invoker) throw new Error('Missing worker queue configuration');
initializeApp({ credential: applicationDefault(), projectId: project });
const db = getFirestore();
const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
const hostingApi = googleApi(auth, 'https://firebasehosting.googleapis.com/v1beta1');
const tasksApi = googleApi(auth, 'https://cloudtasks.googleapis.com/v2');
const cloudBuildApi = googleApi(auth, 'https://cloudbuild.googleapis.com/v1');
const state = db.collection('_sitemap').doc('status');
const push = (task) => enqueue({ api: tasksApi, project, site, region, queue, workerUrl, invoker, ...task });
let publishing = false;

async function json(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body) > 8192) throw new Error('Request body too large');
  }
  return body ? JSON.parse(body) : {};
}

// Cloud Run IAM enforces authentication. Deploy with concurrency=1 and max-instances=1.
createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  const send = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
  try {
    if (req.method === 'GET' && path === '/status') {
      send(200, (await state.get()).data() || {}); return;
    }
    if (req.method !== 'POST') { send(404, { error: 'Not found' }); return; }
    if (path === '/events') {
      const subject = String(req.headers['ce-subject'] || '');
      if (!/^documents\/(articles|services|pricing_plans|article_categories|site_settings)\/[^/]+$/.test(subject)) {
        req.resume(); send(204, {}); return;
      }
      req.resume(); send(202, await push(refreshTask(Date.now(), releaseMode === 'static' ? { mode: 'build-static' } : {}))); return;
    }
    if (path === '/repair') { req.resume(); send(202, await push(refreshTask(Date.now(), releaseMode === 'static' ? { mode: 'build-static' } : {}))); return; }
    if (path === '/scheduled-publications') {
      req.resume();
      const result = await publishDueScheduledArticles(db, FieldValue.serverTimestamp(), new Date());
      const queued = result.published > 0 ? await push(refreshTask(Date.now(), releaseMode === 'static' ? { mode: 'build-static' } : {})) : null;
      send(200, { ...result, queued }); return;
    }
    if (path === '/deploy') {
      const { candidateVersion } = await json(req);
      if (!new RegExp(`^sites/${site}/versions/[a-zA-Z0-9_-]+$`).test(candidateVersion || '')) { send(400, { error: 'Invalid version' }); return; }
      const sequence = await db.runTransaction(async (tx) => {
        const ref = db.collection('_sitemap').doc('sequence');
        const next = Number((await tx.get(ref)).data()?.value || 0) + 1;
        tx.set(ref, { value: next }); return next;
      });
      send(202, { ...await push({ id: `web-${sequence}-${randomUUID()}`, payload: { candidateVersion, sequence } }), sequence }); return;
    }
    if (path === '/deploy-static') {
      const { candidateVersion, snapshotDigest, sitemapUrlCount } = await json(req);
      if (!new RegExp(`^sites/${site}/versions/[a-zA-Z0-9_-]+$`).test(candidateVersion || '') || !/^[a-f0-9]{64}$/i.test(snapshotDigest || '') || !Number.isSafeInteger(sitemapUrlCount) || sitemapUrlCount < 1 || sitemapUrlCount > 50_000) { send(400, { error: 'Invalid static release request' }); return; }
      const sequence = await db.runTransaction(async (tx) => {
        const ref = db.collection('_sitemap').doc('sequence');
        const next = Number((await tx.get(ref)).data()?.value || 0) + 1;
        tx.set(ref, { value: next }); return next;
      });
      send(202, { ...await push({ id: `static-${sequence}-${randomUUID()}`, payload: { mode: 'static', candidateVersion, snapshotDigest, sitemapUrlCount, sequence } }), sequence }); return;
    }
    if (path !== '/publish') { send(404, { error: 'Not found' }); return; }
    if (req.headers['x-cloudtasks-queuename'] !== queue) { send(403, { error: 'Publication requires queue' }); return; }
    if (publishing) { send(503, { error: 'Publication busy' }); return; }
    publishing = true;
    const started = Date.now();
    try {
      const payload = await json(req);
      const signal = AbortSignal.timeout(120000);
      if (payload.mode === 'build-static') {
        if (!staticBuildSourceBucket || !staticBuildSourceObject) throw new Error('STATIC_BUILD_SOURCE_BUCKET and STATIC_BUILD_SOURCE_OBJECT are required for static releases');
        const storageSource = { bucket: staticBuildSourceBucket, object: staticBuildSourceObject };
        if (staticBuildSourceGeneration) storageSource.generation = String(staticBuildSourceGeneration);
        const build = await cloudBuildApi(`projects/${project}/builds`, {
          method: 'POST',
          body: staticBuildRequest({ source: storageSource, serviceAccount: staticBuildServiceAccount, workerUrl, stageOnly: staticBuildStageOnly }),
          signal,
        });
        await state.set({ status: 'building', buildId: build.id || null, requestedAt: FieldValue.serverTimestamp(), lastError: FieldValue.delete() }, { merge: true });
        send(200, { status: 'building', buildId: build.id || null }); return;
      }
      if (payload.mode === 'static') {
        const result = await publishStaticSite({ api: hostingApi, site, candidateVersion: payload.candidateVersion, snapshotDigest: payload.snapshotDigest, sequence: payload.sequence, signal });
        await recordReleaseLog(db, releaseLogFromResult(result, { mode: 'static', count: payload.sitemapUrlCount, sequence: payload.sequence }, FieldValue.serverTimestamp()));
        await state.set({ ...result, status: result.status, count: payload.sitemapUrlCount, snapshotDigest: payload.snapshotDigest, checkedAt: FieldValue.serverTimestamp(), lastError: FieldValue.delete(), elapsedMs: Date.now() - started }, { merge: true });
        send(200, result); return;
      }
      const { xml, urls } = buildSitemap(await loadSource(db));
      signal.throwIfAborted();
      const result = await publishSitemap({ api: hostingApi, site, xml, candidateVersion: payload.candidateVersion, sequence: payload.sequence, signal });
      await recordReleaseLog(db, releaseLogFromResult(result, { mode: 'sitemap', count: urls.length, sequence: payload.sequence }, FieldValue.serverTimestamp()));
      await state.set({ ...result, count: urls.length, checkedAt: FieldValue.serverTimestamp(), lastError: FieldValue.delete(), elapsedMs: Date.now() - started }, { merge: true });
      console.log(JSON.stringify({ event: 'sitemap_checked', ...result, count: urls.length, elapsedMs: Date.now() - started }));
      send(200, result);
    } catch (error) {
      // Return non-2xx for bounded Cloud Tasks retries. Live Hosting is untouched until release.
      await state.set({ failedAt: FieldValue.serverTimestamp(), lastError: error.message.slice(0, 300) }, { merge: true }).catch(() => {});
      throw error;
    } finally { publishing = false; }
  } catch (error) {
    console.error(JSON.stringify({ event: 'sitemap_failed', error: error.message.slice(0, 300) }));
    send(500, { error: 'Operation failed; retry scheduled by queue' });
  }
}).listen(Number(process.env.PORT || 8080));
