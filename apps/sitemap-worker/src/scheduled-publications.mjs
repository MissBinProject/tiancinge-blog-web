const validInstant = (value) => typeof value === 'string' && !Number.isNaN(Date.parse(value));

export function taipeiDate(instant) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(instant));
}

export function isDueScheduledArticle(row, now = new Date()) {
  return row?.status === 'scheduled' && validInstant(row.scheduledAt) && Date.parse(row.scheduledAt) <= now.valueOf() && row.deletedAt == null && row.deleted_at == null;
}

export async function publishDueScheduledArticles(db, serverTimestamp, now = new Date()) {
  const snapshot = await db.collection('articles').where('status', '==', 'scheduled').limit(200).get();
  const refs = snapshot.docs.filter((doc) => isDueScheduledArticle(doc.data(), now)).map((doc) => doc.ref);
  if (!refs.length) return { published: 0 };

  let published = 0;
  await db.runTransaction(async (transaction) => {
    const current = await Promise.all(refs.map((ref) => transaction.get(ref)));
    for (const doc of current) {
      const row = doc.data();
      if (!isDueScheduledArticle(row, now)) continue;
      transaction.update(doc.ref, {
        status: 'published',
        publishedAt: taipeiDate(row.scheduledAt),
        releasedAt: serverTimestamp,
        updatedAt: serverTimestamp,
        version: Number.isInteger(row.version) ? row.version + 1 : 2,
      });
      published += 1;
    }
  });
  return { published };
}
