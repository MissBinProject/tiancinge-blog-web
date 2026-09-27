'use client';

import { useEffect, useRef, useState } from 'react';

/** Load a below-the-fold artwork shortly before it enters the viewport. */
export function DeferredBackground({ className, src }: { className: string; src?: string }) {
  const target = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!src) return;
    if (!('IntersectionObserver' in window)) { setLoaded(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      setLoaded(true);
      observer.disconnect();
    }, { rootMargin: '300px 0px' });
    if (target.current) observer.observe(target.current);
    return () => observer.disconnect();
  }, [src]);

  return <div ref={target} className={className} aria-hidden="true" style={loaded && src ? { backgroundImage: `url(${src})` } : undefined} />;
}
