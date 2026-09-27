import type { NextConfig } from 'next';
const staticExport = process.env.STATIC_EXPORT === '1';
const serverHeaders = async () => [{
  source: '/(.*)',
  headers: [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
    { key: 'Content-Security-Policy-Report-Only', value: "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' https: data: blob:; media-src 'self' https: blob:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.google.com; frame-src 'self' https://www.google.com https://maps.google.com https://www.youtube-nocookie.com;" },
  ],
}];
const nextConfig: NextConfig = {
  transpilePackages: ['@tian-xin-ge/contracts', '@tian-xin-ge/design-tokens'],
  // The API Cloud Run build stays standalone. The release coordinator sets
  // STATIC_EXPORT=1 for the public Hosting artifact and supplies one snapshot.
  output: staticExport ? 'export' : 'standalone',
  poweredByHeader: false,
  // Keep development screenshots comparable with the supplied design boards.
  devIndicators: false,
  ...(staticExport ? {} : { headers: serverHeaders }),
};
export default nextConfig;
