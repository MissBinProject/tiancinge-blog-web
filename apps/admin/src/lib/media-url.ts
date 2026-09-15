/** Resolve site-relative assets against the public website instead of the admin origin. */
export function resolveMediaUrl(url: string, webOrigin: string): string {
  const value = url.trim();
  if (!value || /^(https?:|blob:|data:)/i.test(value)) return value;
  if (value.startsWith('/')) return `${webOrigin.replace(/\/+$/, '')}${value}`;
  return value;
}
