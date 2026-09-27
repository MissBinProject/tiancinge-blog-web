function cleanText(value, maximum = 240) {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : '';
}

function versionId(value) {
  const last = cleanText(value).split('/').at(-1) || '';
  return last.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 120);
}

/**
 * Converts a successful Hosting publication into a safe, idempotent audit row.
 * A retry may see the same sequence as superseded because the first attempt
 * already switched the live channel. That exact sequence still needs logging.
 */
export function releaseLogFromResult(result, details, publishedAt) {
  const requestedSequence = Number(details.sequence || 0);
  const resultSequence = Number(result.sequence || 0);
  const completed = result.status === 'published'
    || (result.status === 'superseded' && requestedSequence > 0 && resultSequence === requestedSequence);
  if (!completed) return null;
  const id = versionId(result.version);
  if (!id) return null;
  return {
    id: `hosting-${id}`,
    data: {
      publishedAt,
      source: 'automatic',
      status: 'published',
      mode: details.mode === 'static' ? 'static' : 'sitemap',
      count: Number.isSafeInteger(details.count) && details.count >= 0 ? details.count : 0,
      sequence: resultSequence || requestedSequence || 0,
      version: cleanText(result.version),
      release: cleanText(result.release),
    },
  };
}

export async function recordReleaseLog(db, record) {
  if (!record) return false;
  const ref = db.collection('web_release_logs').doc(record.id);
  return db.runTransaction(async (transaction) => {
    if ((await transaction.get(ref)).exists) return false;
    transaction.create(ref, record.data);
    return true;
  });
}
