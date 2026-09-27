import type { Metadata } from 'next';
import './globals.css';
import { AsyncFonts } from '@/components/AsyncFonts';

// Settings and SEO metadata are editable in the admin. Do not let a build-time
// layout cache keep stale brand, description, or OG values after a refresh.
// Keep the root metadata independent from a request. Individual static pages
// produce their editable SEO metadata from the immutable release snapshot.
export const metadata: Metadata = {
  title: '天心閣養生會館',
  description: '天心閣養生會館官方網站',
  icons: {
    icon: { url: '/assets/logo/logo_1_圓形精緻.png', type: 'image/png' },
    apple: '/assets/logo/logo_1_圓形精緻.png',
  },
  verification: { google: 'Rpvxg4CunReSVKRMg1YnTIvgsuRtc87B2ItUGseUYeQ' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant" data-scroll-behavior="smooth"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;600&display=swap"/></noscript></head><body><AsyncFonts/>{children}</body></html>;
}
