#!/usr/bin/env node

import { writeFile } from 'node:fs/promises';

const base = (process.env.SEO_BASE_URL || 'https://tiancinge-web.web.app').replace(/\/+$/, '');
const result = { base, checkedAt: new Date().toISOString(), sitemap: null, routes: [], discoveredRoutes: [], discoveredInternalPaths: [], omittedInternalPaths: [], duplicateTitles: [], duplicateDescriptions: [], duplicateH1s: [], qualityWarnings: [], errors: [] };
const allowedOmitted = new Set(['/privacy', '/terms', '/editorial', '/search']);

function absolute(path) { return new URL(path, `${base}/`).toString(); }
function decode(value) { try { return value.replaceAll('&amp;', '&'); } catch { return value; } }
function firstMatch(source, pattern) { return source.match(pattern)?.[1]?.trim() || ''; }
function stripTags(value) { return value.replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&(?:nbsp|amp|lt|gt|quot);/g, ' ').replace(/\s+/g, ' ').trim(); }
function internalPath(href) {
  if (!href || href.startsWith('#') || /^(?:mailto|tel|javascript):/i.test(href)) return null;
  try {
    const url = new URL(href, `${base}/`);
    if (url.origin !== base || url.search || url.hash) return null;
    return url.pathname || '/';
  } catch { return null; }
}

async function fetchPage(path) {
  const response = await fetch(absolute(path), { redirect: 'manual', headers: { 'User-Agent': 'SEO-Audit/1.0' } });
  return { response, html: await response.text() };
}

function inspect(path, response, html, expectedUrl, routeCollection = result.routes) {
  const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = firstMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i) || firstMatch(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i);
  const canonical = decode(firstMatch(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["'][^>]*>/i));
  const robots = firstMatch(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["'][^>]*>/i) || firstMatch(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']robots["'][^>]*>/i);
  const h1Count = [...html.matchAll(/<h1\b/gi)].length;
  const h1 = decode(stripTags(firstMatch(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i)));
  const breadcrumb = /<nav\b[^>]*class=["'][^"']*\bbreadcrumbs\b/i.test(html);
  const main = firstMatch(html, /<main\b[^>]*>([\s\S]*?)<\/main>/i);
  const articleBody = firstMatch(html, /<div\b[^>]*class=["'][^"']*article-body-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  const serviceBody = /^\/services\/[^/]+$/.test(path) ? firstMatch(html, /<article\b[^>]*>([\s\S]*?)<\/article>/i) : '';
  const mainTextLength = stripTags(main).length;
  const articleBodyTextLength = stripTags(articleBody).length;
  const serviceBodyTextLength = stripTags(serviceBody).length;
  const imageTags = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  const imageAlts = imageTags.map((tag) => tag.match(/\balt=["']([^"']*)["']/i)?.[1] ?? null);
  const missingAltCount = imageAlts.filter((alt) => alt === null).length;
  const duplicateAltTexts = [...new Set(imageAlts.filter(Boolean).filter((value, index, values) => values.indexOf(value) !== index))];
  const internalLinks = [...html.matchAll(/\bhref=["']([^"']+)["']/gi)].map((match) => internalPath(decode(match[1]))).filter((path) => path && !path.split('/').pop().includes('.'));
  const needsBreadcrumb = (value) => /^\/(?:services|news|blog)(?:\/|$)/.test(value);
  const headerRobots = response.headers.get('x-robots-tag') || '';
  const indexable = response.status === 200 && !/noindex/i.test(`${robots} ${headerRobots}`) && Boolean(title && description) && canonical === expectedUrl && h1Count === 1 && mainTextLength > 0 && (!needsBreadcrumb(path) || breadcrumb);
  const item = { path, url: expectedUrl, result: indexable ? 'pass' : 'fail', status: response.status, redirect: response.headers.get('location'), title, description, robots, headerRobots, canonical, h1, h1Count, breadcrumb, articleBodyTextLength, serviceBodyTextLength, mainTextLength, imageCount: imageTags.length, missingAltCount, duplicateAltTexts, internalLinkCount: new Set(internalLinks).size };
  routeCollection.push(item);
  for (const linked of internalLinks) if (!result.discoveredInternalPaths.includes(linked)) result.discoveredInternalPaths.push(linked);
  if (response.status !== 200) result.errors.push(`${path}: HTTP ${response.status}`);
  if (response.status === 200 && (!title || !description || canonical !== expectedUrl || h1Count !== 1 || /noindex/i.test(`${robots} ${headerRobots}`) || mainTextLength === 0 || (needsBreadcrumb(path) && !breadcrumb))) result.errors.push(`${path}: indexability metadata/content check failed`);
  if (response.status === 200 && /^\/(?:news|blog)\/[^/]+$/.test(path) && articleBodyTextLength > 0 && articleBodyTextLength < 120) result.qualityWarnings.push(`${path}: article body is short (${articleBodyTextLength} characters); content review required before treating it as a strong search landing page`);
  if (response.status === 200 && /^\/services\/[^/]+$/.test(path) && serviceBodyTextLength < 120) result.qualityWarnings.push(`${path}: service detail body is short (${serviceBodyTextLength} characters); confirm treatment flow, suitable scenarios and booking conditions before treating it as a strong search landing page`);
  if (response.status === 200 && missingAltCount > 0) result.qualityWarnings.push(`${path}: ${missingAltCount} image(s) have no alt attribute; content review required`);
  if (response.status === 200 && duplicateAltTexts.length > 0) result.qualityWarnings.push(`${path}: repeated non-empty image alt text detected (${duplicateAltTexts.join(', ')}); confirm repeated cards are intentional`);
  return item;
}

const sitemap = await fetchPage('/sitemap.xml');
const sitemapUrls = [...sitemap.html.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => decode(match[1].trim()));
const uniqueUrls = [...new Set(sitemapUrls)];
result.sitemap = { status: sitemap.response.status, urlCount: sitemapUrls.length, uniqueUrlCount: uniqueUrls.length, contentType: sitemap.response.headers.get('content-type') };
if (sitemap.response.status !== 200 || !/xml/i.test(result.sitemap.contentType || '')) result.errors.push('/sitemap.xml: HTTP or XML content type failed');
if (sitemapUrls.length !== uniqueUrls.length) result.errors.push('/sitemap.xml: duplicate URL');

for (const url of uniqueUrls) {
  const parsed = new URL(url);
  if (parsed.origin !== base || parsed.search || parsed.hash) { result.errors.push(`${url}: invalid sitemap URL`); continue; }
  const page = await fetchPage(parsed.pathname);
  inspect(parsed.pathname, page.response, page.html, url);
}

// Sitemap routes are the release gate. Also inspect crawlable routes found via
// standard internal links, especially category and pagination pages that are
// intentionally not all listed in the sitemap. Legal/search pages are allowed
// omissions and are excluded from this secondary crawl check.
const sitemapPaths = new Set(uniqueUrls.map((url) => new URL(url).pathname));
const secondaryPaths = result.discoveredInternalPaths.filter((path) => !sitemapPaths.has(path) && !allowedOmitted.has(path));
for (const path of secondaryPaths) {
  const page = await fetchPage(path);
  inspect(path, page.response, page.html, absolute(path), result.discoveredRoutes);
}

result.discoveredInternalPaths.sort();
result.omittedInternalPaths = result.discoveredInternalPaths.filter((path) => !sitemapPaths.has(path) && !allowedOmitted.has(path));
if (result.omittedInternalPaths.length) result.errors.push(`internal links omitted from sitemap: ${result.omittedInternalPaths.join(', ')}`);

for (const field of ['title', 'description']) {
  const groups = new Map();
  for (const route of [...result.routes, ...result.discoveredRoutes]) if (route[field]) groups.set(route[field], [...(groups.get(route[field]) || []), route.path]);
  result[field === 'title' ? 'duplicateTitles' : 'duplicateDescriptions'] = [...groups.entries()].filter(([, paths]) => paths.length > 1).map(([value, paths]) => ({ value, paths }));
}

const h1Groups = new Map();
for (const route of [...result.routes, ...result.discoveredRoutes]) if (route.h1) h1Groups.set(route.h1, [...(h1Groups.get(route.h1) || []), route.path]);
result.duplicateH1s = [...h1Groups.entries()].filter(([, paths]) => paths.length > 1).map(([value, paths]) => ({ value, paths }));
if (result.duplicateH1s.length) result.errors.push(`duplicate H1 text: ${result.duplicateH1s.map(({ value }) => value).join(', ')}`);

if (process.env.SEO_AUDIT_OUTPUT) await writeFile(process.env.SEO_AUDIT_OUTPUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (process.env.SEO_AUDIT_TABLE === '1') {
  const routes = [...result.routes, ...result.discoveredRoutes];
  const escapeCell = (value) => String(value ?? '').replaceAll('\t', ' ').replaceAll('\n', ' ');
  console.log('\nURL\tHTTP\tROBOTS\tCANONICAL\tTITLE\tH1\tRESULT');
  for (const route of routes) console.log([
    route.url,
    route.status,
    /noindex/i.test(`${route.robots} ${route.headerRobots}`) ? 'noindex' : 'indexable',
    route.canonical,
    route.title,
    route.h1,
    route.result,
  ].map(escapeCell).join('\t'));
}
if (result.errors.length) { console.error(`SEO indexability audit failed: ${result.errors.length} error(s)`); process.exitCode = 1; }
else console.error(`SEO indexability audit passed: ${result.routes.length} sitemap route(s)`);
