'use client';

import { useState } from 'react';

const FALLBACK_SRC = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><rect width="800" height="500" fill="#fff2f2"/><path d="M0 410c180-120 290-70 410-145 150-92 250-73 390-160v395H0z" fill="#f7cdd5"/><circle cx="400" cy="210" r="76" fill="#c9486b" fill-opacity=".18"/><text x="400" y="220" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#9c5366">圖片暫缺</text></svg>')}`;

type SafeImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & { src?: string; fallbackAlt?: string };

export function SafeImage({ src, alt, fallbackAlt, ...props }: SafeImageProps) {
  const [failed, setFailed] = useState(!src);
  if (failed) return <img {...props} src={FALLBACK_SRC} alt={fallbackAlt || `${alt || '圖片'}（圖片暫缺）`} />;
  return <img {...props} src={src} alt={alt} onError={() => setFailed(true)} />;
}
