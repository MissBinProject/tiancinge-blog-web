import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { isSupportedMediaMimeType, mediaStoragePath, normalizeImageBuffer, validateImageBuffer, validateVideoBuffer } from './media-utils';

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

  it('accepts MP4, MOV and WebM signatures while rejecting mismatched video data', () => {
    const mp4 = new Uint8Array(12); mp4.set([0x66, 0x74, 0x79, 0x70], 4);
    const webm = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(validateVideoBuffer(mp4, 'video/mp4')).toBe(true);
    expect(validateVideoBuffer(mp4, 'video/quicktime')).toBe(true);
    expect(validateVideoBuffer(webm, 'video/webm')).toBe(true);
    expect(validateVideoBuffer(mp4, 'video/webm')).toBe(false);
    expect(isSupportedMediaMimeType('video/quicktime')).toBe(true);
  });

  it('decodes and re-encodes images as metadata-free WebP', async () => {
    const source = await sharp({ create: { width: 10, height: 6, channels: 3, background: { r: 236, g: 88, b: 120 } } })
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();
    const normalized = await normalizeImageBuffer(source, 'image/jpeg');
    expect(normalized).not.toBeNull();
    if (!normalized) return;
    const metadata = await sharp(normalized.data).metadata();
    expect(metadata.format).toBe('webp');
    expect(metadata.orientation).toBeUndefined();
    expect(normalized.width * normalized.height).toBe(60);
  });
});
