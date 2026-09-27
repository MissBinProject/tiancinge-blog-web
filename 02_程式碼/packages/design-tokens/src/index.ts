/** Shared visual constants for the public site and admin app. */
export const designTokens = {
  colors: {
    ink: '#281a1e',
    rose: '#c9486b',
    roseDark: '#a92f52',
    blush: '#fff2f2',
    line: '#eab7bd',
    paper: '#fffafa',
    muted: '#806c73',
    border: '#f0dfe2',
  },
  fonts: {
    serif: "'Noto Serif TC', serif",
    sans: "'Noto Sans TC', sans-serif",
  },
  radii: {
    sm: '7px',
    md: '8px',
    lg: '12px',
    pill: '999px',
  },
  spacing: {
    pageGutter: '48px',
    mobileGutter: '18px',
  },
} as const;

export type DesignTokens = typeof designTokens;
