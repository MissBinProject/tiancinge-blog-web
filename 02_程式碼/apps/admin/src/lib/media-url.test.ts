import { describe, expect, it } from 'vitest';
import { resolveMediaUrl } from './media-url';

describe('resolveMediaUrl', () => {
  it('points site-relative assets at the public website', () => {
    expect(resolveMediaUrl('/assets/crops/blog-1.png', 'https://tiancinge-web.web.app/')).toBe('https://tiancinge-web.web.app/assets/crops/blog-1.png');
  });

  it('keeps uploaded and preview URLs unchanged', () => {
    expect(resolveMediaUrl('https://storage.googleapis.com/image.webp', 'https://example.com')).toBe('https://storage.googleapis.com/image.webp');
    expect(resolveMediaUrl('blob:test', 'https://example.com')).toBe('blob:test');
  });
});
