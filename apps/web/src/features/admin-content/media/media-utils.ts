import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
export const MAX_MEDIA_BYTES = MAX_VIDEO_BYTES;
export const MAX_IMAGE_PIXELS = 40_000_000;
const MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VIDEO_MIME_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

export function isSupportedMediaMimeType(value: string): boolean {
  return MIME_TYPES.has(value) || VIDEO_MIME_TYPES.has(value);
}

export function safeMediaName(name: string): string {
  const cleaned = name.normalize('NFKC').replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').slice(0, 100);
  return cleaned || 'upload';
}

function readUint32(bytes: Uint8Array, offset: number): number { return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0; }

function imageDimensions(bytes: Uint8Array, mimeType: string): { width: number; height: number } | null {
  if (mimeType === 'image/png' && bytes.length >= 24 && readUint32(bytes, 0) === 0x89504e47 && readUint32(bytes, 4) === 0x0d0a1a0a) return { width: readUint32(bytes, 16), height: readUint32(bytes, 20) };
  if (mimeType === 'image/webp' && bytes.length >= 30 && readUint32(bytes, 0) === 0x52494646 && readUint32(bytes, 8) === 0x57454250) {
    const chunk = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
    if (chunk === 'VP8X') return { width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16), height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16) };
    if (chunk === 'VP8 ' && bytes.length >= 30) return { width: bytes[26] | (bytes[27] << 8), height: bytes[28] | (bytes[29] << 8) };
    if (chunk === 'VP8L' && bytes.length >= 25) return { width: 1 + bytes[21] + ((bytes[22] & 0x3f) << 8), height: 1 + ((bytes[22] >> 6) | (bytes[23] << 2) | ((bytes[24] & 0x0f) << 10)) };
  }
  if (mimeType === 'image/jpeg' && bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset += 1; continue; }
      const marker = bytes[offset + 1]; offset += 2;
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) break;
      const length = (bytes[offset] << 8) | bytes[offset + 1];
      if (length < 2 || offset + length > bytes.length) break;
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) return { height: (bytes[offset + 3] << 8) | bytes[offset + 4], width: (bytes[offset + 5] << 8) | bytes[offset + 6] };
      offset += length;
    }
  }
  return null;
}

export function validateImageBuffer(bytes: Uint8Array, mimeType: string): { width: number; height: number } | null {
  if (!MIME_TYPES.has(mimeType) || bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) return null;
  const validHeader = mimeType === 'image/jpeg' ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff : mimeType === 'image/png' ? bytes.length >= 8 && readUint32(bytes, 0) === 0x89504e47 && readUint32(bytes, 4) === 0x0d0a1a0a : bytes.length >= 12 && readUint32(bytes, 0) === 0x52494646 && readUint32(bytes, 8) === 0x57454250;
  if (!validHeader) return null;
  const dimensions = imageDimensions(bytes, mimeType);
  if (!dimensions || dimensions.width < 1 || dimensions.height < 1 || dimensions.width * dimensions.height > MAX_IMAGE_PIXELS) return null;
  return dimensions;
}

export type NormalizedImage = { data: Buffer; width: number; height: number };

/** Decode with a bounded pixel budget, apply EXIF orientation, strip metadata,
 * and store a single browser-safe format. */
export async function normalizeImageBuffer(bytes: Uint8Array, mimeType: string): Promise<NormalizedImage | null> {
  const dimensions = validateImageBuffer(bytes, mimeType);
  if (!dimensions) return null;
  try {
    const result = await sharp(Buffer.from(bytes), { limitInputPixels: MAX_IMAGE_PIXELS, failOn: 'error' })
      .rotate()
      .webp({ quality: 82, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    const width = Number(result.info.width);
    const height = Number(result.info.height);
    if (!width || !height || width * height > MAX_IMAGE_PIXELS || result.data.byteLength > MAX_IMAGE_BYTES) return null;
    return { data: result.data, width, height };
  } catch {
    return null;
  }
}

/** Validate the container signature before storing browser-playable video files. */
export function validateVideoBuffer(bytes: Uint8Array, mimeType: string): boolean {
  if (!VIDEO_MIME_TYPES.has(mimeType) || bytes.length < 12 || bytes.length > MAX_VIDEO_BYTES) return false;
  if (mimeType === 'video/mp4' || mimeType === 'video/quicktime') return String.fromCharCode(...bytes.slice(4, 8)) === 'ftyp';
  return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
}

export function mediaStoragePath(name: string): string { return `site-media/${randomUUID()}-${safeMediaName(name)}`; }

export function mediaDownloadUrl(bucketName: string, path: string, token: string): string { return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media&token=${token}`; }
