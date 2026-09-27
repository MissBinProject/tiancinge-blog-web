'use client';

import { useEffect } from 'react';

const FONT_STYLESHEET = 'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;600&display=swap';

export function AsyncFonts() {
  useEffect(() => {
    if (document.querySelector('link[data-site-fonts]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_STYLESHEET;
    link.dataset.siteFonts = 'true';
    document.head.appendChild(link);
  }, []);

  return null;
}
