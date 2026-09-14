#!/usr/bin/env node

/**
 * Deployment preflight. It validates presence and shape without printing any
 * secret values. Set ALLOW_LOCAL_PREFLIGHT=1 only for a local/staging check.
 */
const allowLocal = process.env.ALLOW_LOCAL_PREFLIGHT === '1';
const required = [
  ['NEXT_PUBLIC_SITE_URL', '官網'],
  ['NEXT_PUBLIC_SUPABASE_URL', '官網'],
  ['NEXT_PUBLIC_SUPABASE_ANON_KEY', '官網'],
  ['SUPABASE_SERVICE_ROLE_KEY', '官網伺服器'],
  ['VITE_WEB_URL', '後台'],
  ['VITE_SUPABASE_URL', '後台'],
  ['VITE_SUPABASE_ANON_KEY', '後台'],
];
const failures = [];
const placeholder = /(your-|change[-_ ]?me|replace[-_ ]?this|example(?:\.com)?)/i;

for (const [name, scope] of required) {
  const value = process.env[name]?.trim() || '';
  if (!value) {
    failures.push(`${scope}缺少 ${name}`);
    continue;
  }
  if (placeholder.test(value)) failures.push(`${scope}${name} 仍是範例值`);
  if (name.endsWith('_URL')) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' && !(allowLocal && url.hostname === 'localhost')) failures.push(`${name} 必須使用 https://`);
      if (!allowLocal && ['localhost', '127.0.0.1'].includes(url.hostname)) failures.push(`${name} 不能使用本機網址`);
    } catch {
      failures.push(`${name} 不是有效網址`);
    }
  }
  if (name.endsWith('_KEY') && value.length < 20) failures.push(`${name} 長度看起來不完整`);
}

if (failures.length) {
  console.error('Production environment preflight failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('請依 02_規劃書/project/production-input-form.md 設定，再重新執行。');
  process.exit(1);
}

console.log(`Production environment preflight passed (${required.length} variables checked; values were not printed).`);
