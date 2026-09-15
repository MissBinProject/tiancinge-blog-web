import { describe, expect, it } from 'vitest';
import { mediaStoragePath, validateImageBuffer } from './media-utils';

describe('media upload validation', () => {
  it('accepts a PNG with a valid header and dimensions', () => {
    const bytes = new Uint8Array(24);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
    bytes.set([0x00, 0x00, 0x00, 0x64], 16);
    bytes.set([0x00, 0x00, 0x00, 0xc8], 20);
    expect(validateImageBuffer(bytes, 'image/png')).toEqual({ width: 100, height: 200 });
  });

  it('rejects mismatched headers and unsafe oversized dimensions', () => {
    const bytes = new Uint8Array(24);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
    bytes.fill(0xff, 16);
    expect(validateImageBuffer(bytes, 'image/jpeg')).toBeNull();
    expect(validateImageBuffer(bytes, 'application/octet-stream')).toBeNull();
  });

  it('generates server-owned site-media paths', () => {
    const path = mediaStoragePath('我的 圖片.png');
    expect(path).toMatch(/^site-media\/[0-9a-f-]+-[-a-zA-Z0-9.]+$/);
    expect(path).not.toContain(' ');
  });
});
