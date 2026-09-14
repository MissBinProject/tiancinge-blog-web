import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  transpilePackages: ['@tian-xin-ge/contracts', '@tian-xin-ge/design-tokens'],
  output: 'standalone',
  // Keep development screenshots comparable with the supplied design boards.
  devIndicators: false,
};
export default nextConfig;
