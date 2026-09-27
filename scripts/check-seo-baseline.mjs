#!/usr/bin/env node

const base = (process.env.SEO_BASE_URL || 'https://tiancinge-web.web.app').replace(/\/+$/, '');
// Keep important non-sitemap routes in the regression baseline as well. Legal
// pages are indexable; search/editorial are intentionally noindex but still
// need stable server-rendered metadata and canonical URLs.
const requiredRoutes = ['/', '/services', '/pricing', '/news', '/blog', '/privacy', '/terms', '/search', '/editorial'];
const result = { base, checkedAt: new Date().toISOString(), routes: [], sitemap: null, errors: [] };

function absolute(path) {
  return new URL(path, `${base}/`).toString();
}

function firstMatch(source, pattern) {
  return source.match(pattern)?.[1]?.trim() || '';
}

function jsonLdTypes(html) {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].flatMap((match) => {
    try {
      const value = JSON.parse(match[1]);
      return Array.isArray(value) ? value.map((item) => item?.['@type']).filter(Boolean) : [value?.['@type']].filter(Boolean);
    } catch {
      return [];
    }
  });
}

async function fetchText(path) {
  const response = await fetch(absolute(path), { redirect: 'manual' });
  const text = await response.text();
  return { response, text };
}

async function inspectPage(path, expectedStatus = 200) {
  try {
    const { response, text } = await fetchText(path);
    const title = firstMatch(text, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const description = firstMatch(text, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i);
    const canonical = firstMatch(text, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["'][^>]*>/i);
    const h1Count = [...text.matchAll(/<h1\b/gi)].length;
    const missingAlt = [...text.matchAll(/<img\b([^>]*)>/gi)].filter((match) => !/\balt\s*=\s*["'][^"']*["']/i.test(match[1])).length;
    const item = { path, status: response.status, title, description, canonical, h1Count, jsonLdTypes: jsonLdTypes(text), missingAlt };
    result.routes.push(item);
    if (response.status !== expectedStatus) result.errors.push(`${path}: 預期 HTTP ${expectedStatus}，實際 ${response.status}`);
    if (expectedStatus === 200 && (!title || !description || !canonical || h1Count !== 1)) result.errors.push(`${path}: 缺少 title／description／canonical 或 H1 數量不是 1`);
    if (expectedStatus === 200 && missingAlt > 0) result.errors.push(`${path}: 有 ${missingAlt} 張圖片缺少 alt`);
    return item;
  } catch (error) {
    result.errors.push(`${path}: ${error instanceof Error ? error.message : '請求失敗'}`);
    return null;
  }
}

try {
  const sitemapResponse = await fetchText('/sitemap.xml');
  if (!sitemapResponse.response.ok) result.errors.push(`/sitemap.xml: HTTP ${sitemapResponse.response.status}`);
  const urls = [...sitemapResponse.text.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => match[1].trim());
  const uniqueUrls = [...new Set(urls)];
  result.sitemap = { status: sitemapResponse.response.status, urlCount: urls.length, uniqueUrlCount: uniqueUrls.length, hasNonHttps: uniqueUrls.some((url) => !url.startsWith('https://')), hasSearch: uniqueUrls.some((url) => new URL(url).pathname === '/search') };
  if (urls.length !== uniqueUrls.length) result.errors.push('/sitemap.xml: URL 重複');
  if (result.sitemap.hasNonHttps || result.sitemap.hasSearch) result.errors.push('/sitemap.xml: 含非 HTTPS 或搜尋頁 URL');
  const detailPaths = uniqueUrls.map((url) => new URL(url).pathname).filter((path) => /^(?:\/services|\/news|\/blog)\/[^/]+$/.test(path));
  const firstByType = (type) => detailPaths.find((path) => path.startsWith(`/${type}/`));
  for (const path of requiredRoutes) await inspectPage(path);
  const robots = await fetchText('/robots.txt');
  const disallowsSearch = /disallow:\s*\/search(?:\s|$)/im.test(robots.text);
  result.routes.push({ path: '/robots.txt', status: robots.response.status, hasSitemap: /sitemap\.xml/i.test(robots.text), disallowsApi: /disallow:\s*\/api\//i.test(robots.text), disallowsSearch });
  if (robots.response.status !== 200 || !/sitemap\.xml/i.test(robots.text) || !/disallow:\s*\/api\//i.test(robots.text) || !disallowsSearch) result.errors.push('/robots.txt: 狀態或 sitemap／API／搜尋頁規則不符合預期');
  for (const type of ['services', 'news', 'blog']) {
    const path = firstByType(type);
    if (path) await inspectPage(path);
    else result.errors.push(`sitemap: 找不到 ${type} 詳情 URL`);
  }
  await inspectPage('/missing-seo-baseline-route', 404);
} catch (error) {
  result.errors.push(`sitemap: ${error instanceof Error ? error.message : '請求失敗'}`);
}

console.log(JSON.stringify(result, null, 2));
if (result.errors.length) {
  console.error(`SEO baseline failed: ${result.errors.length} error(s)`);
  process.exitCode = 1;
} else {
  console.error(`SEO baseline passed: ${result.routes.length} route(s), ${result.sitemap?.uniqueUrlCount ?? 0} sitemap URL(s)`);
}
