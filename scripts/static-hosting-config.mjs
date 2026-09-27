const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function safeSlug(value) {
  return typeof value === 'string' && value.length <= 80 && slugPattern.test(value);
}

/** Add permanent redirects for every retired service and article URL. */
export function buildStaticHostingConfig(baseConfig, snapshot) {
  const config = structuredClone(baseConfig);
  const hosting = config.hosting?.find((entry) => entry.target === 'web');
  if (!hosting) throw new Error('Static web Hosting target is missing');
  const redirects = new Map((hosting.redirects || []).map((rule) => [rule.source, rule]));
  const addHistory = (prefix, item) => {
    if (!safeSlug(item?.slug) || !Array.isArray(item.previousSlugs)) return;
    const destination = `${prefix}/${item.slug}`;
    for (const previous of item.previousSlugs) {
      if (!safeSlug(previous) || previous === item.slug) continue;
      redirects.set(`${prefix}/${previous}`, { source: `${prefix}/${previous}`, destination, type: 301 });
    }
  };
  for (const service of snapshot.services || []) addHistory('/services', service);
  for (const article of snapshot.articles || []) {
    if (article?.type === 'news' || article?.type === 'blog') addHistory(`/${article.type}`, article);
  }
  hosting.redirects = [...redirects.values()];
  return config;
}
