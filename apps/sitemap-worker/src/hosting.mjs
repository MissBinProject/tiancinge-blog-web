import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { setTimeout as delay } from 'node:timers/promises';
import { robots } from './document.mjs';

export const digest = (value) => createHash('sha256').update(value).digest('hex');
export function sitemapConfig(config = {}) {
  return {
    ...config,
    headers: [
      ...(config.headers || []).filter((rule) => !['/sitemap.xml', '/robots.txt'].includes(rule.glob)),
      { glob: '/sitemap.xml', headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=60', 'X-Content-Type-Options': 'nosniff' } },
      { glob: '/robots.txt', headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=60', 'X-Content-Type-Options': 'nosniff' } },
    ],
  };
}

/** All live releases go through the single Cloud Tasks publication queue. */
export async function publishSitemap({ api, site, xml, candidateVersion, sequence = 0, signal, wait = delay }) {
  const parent = `sites/${site}`;
  const current = async () => (await api(`${parent}/channels/live`, { signal })).release;
  const previous = await current();
  if (!previous?.version?.name) throw new Error('No live Hosting release to preserve');
  const live = await api(previous.version.name, { signal });
  // Static HTML and its sitemap belong to one immutable release. This legacy
  // worker must not replace either a live static version or a static candidate.
  if (live.labels?.['render-mode'] === 'static') throw new Error('Static release requires the full-site publisher');
  const liveSequence = Number(live.labels?.['web-sequence'] || 0);
  if (candidateVersion && sequence <= liveSequence) return { status: 'superseded', version: live.name, sequence: liveSequence };
  const contentHash = digest(xml + robots);
  if (!candidateVersion && live.labels?.['sitemap-digest'] === contentHash) return { status: 'unchanged', version: live.name, sequence: liveSequence };
  if (candidateVersion && !new RegExp(`^sites/${site}/versions/[a-zA-Z0-9_-]+$`).test(candidateVersion)) throw new Error('Invalid candidate version');
  const source = candidateVersion ? await api(candidateVersion, { signal }) : live;
  if (source.labels?.['render-mode'] === 'static') throw new Error('Static candidate requires the full-site publisher');
  if (source.status !== 'FINALIZED') throw new Error('Candidate must be finalized');
  let operation = await api(`${parent}/versions:clone`, { method: 'POST', body: { sourceVersion: source.name, finalize: false }, signal });
  for (let attempt = 0; !operation.done && attempt < 45; attempt++) {
    await wait(1000, undefined, { signal });
    operation = await api(operation.name, { signal });
  }
  if (!operation.done || operation.error) throw new Error('Hosting clone failed or timed out');
  const name = operation.response?.name;
  if (!name?.startsWith(`${parent}/versions/`)) throw new Error('Missing cloned version');
  const blobs = new Map();
  const files = {};
  for (const [path, content] of [['/sitemap.xml', xml], ['/robots.txt', robots]]) {
    const blob = gzipSync(content);
    const hash = digest(blob);
    blobs.set(hash, blob);
    files[path] = hash;
  }
  const upload = await api(`${name}:populateFiles`, { method: 'POST', body: { files }, signal });
  for (const hash of upload.uploadRequiredHashes || []) {
    if (!blobs.has(hash)) throw new Error('Unexpected upload hash');
    const url = new URL(`${upload.uploadUrl}/${hash}`);
    if (url.origin !== 'https://upload-firebasehosting.googleapis.com') throw new Error('Unexpected upload origin');
    await api(url.href, { method: 'POST', binary: blobs.get(hash), signal });
  }
  await api(`${name}?updateMask=status,config,labels`, { method: 'PATCH', body: {
    status: 'FINALIZED', config: sitemapConfig(source.config),
    labels: { ...source.labels, 'sitemap-digest': contentHash, 'web-sequence': String(candidateVersion ? sequence : liveSequence) },
  }, signal });
  // A bypassed/manual release must never be overwritten by a stale snapshot.
  if ((await current()).name !== previous.name) throw new Error('Live release changed during publication; retry against latest');
  signal?.throwIfAborted();
  const release = await api(`${parent}/releases?versionName=${encodeURIComponent(name)}`, { method: 'POST', body: { message: `sitemap-worker ${candidateVersion ? 'web' : 'refresh'}; previous=${live.name}` }, signal });
  return { status: 'published', version: name, release: release.name, previousVersion: live.name, sequence: candidateVersion ? sequence : liveSequence };
}

/** Release an already-validated static artifact without changing its files. */
export async function publishStaticSite({ api, site, candidateVersion, snapshotDigest, sequence = 0, signal, wait = delay }) {
  const parent = `sites/${site}`;
  if (!new RegExp(`^sites/${site}/versions/[a-zA-Z0-9_-]+$`).test(candidateVersion || '')) throw new Error('Invalid static candidate version');
  if (!/^[a-f0-9]{64}$/i.test(snapshotDigest || '')) throw new Error('Invalid static snapshot digest');
  const current = async () => (await api(`${parent}/channels/live`, { signal })).release;
  const previous = await current();
  if (!previous?.version?.name) throw new Error('No live Hosting release to preserve');
  const live = await api(previous.version.name, { signal });
  const liveSequence = Number(live.labels?.['web-sequence'] || 0);
  if (sequence <= liveSequence) return { status: 'superseded', version: live.name, sequence: liveSequence };
  const candidate = await api(candidateVersion, { signal });
  if (candidate.status !== 'FINALIZED') throw new Error('Static candidate must be finalized');
  let operation = await api(`${parent}/versions:clone`, { method: 'POST', body: { sourceVersion: candidateVersion, finalize: false }, signal });
  for (let attempt = 0; !operation.done && attempt < 45; attempt += 1) { await wait(1000, undefined, { signal }); operation = await api(operation.name, { signal }); }
  if (!operation.done || operation.error) throw new Error('Static Hosting clone failed or timed out');
  const name = operation.response?.name;
  if (!name?.startsWith(`${parent}/versions/`)) throw new Error('Missing cloned version');
  await api(`${name}?updateMask=status,config,labels`, { method: 'PATCH', body: { status: 'FINALIZED', config: candidate.config, labels: { ...candidate.labels, 'render-mode': 'static', 'snapshot-digest': snapshotDigest, 'web-sequence': String(sequence) } }, signal });
  if ((await current()).name !== previous.name) throw new Error('Live release changed during static publication; retry against latest');
  const release = await api(`${parent}/releases?versionName=${encodeURIComponent(name)}`, { method: 'POST', body: { message: `static snapshot=${snapshotDigest.slice(0, 12)}; previous=${live.name}` }, signal });
  return { status: 'published', version: name, release: release.name, previousVersion: live.name, sequence };
}
