import { createHmac, timingSafeEqual } from 'node:crypto';

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP_SECONDS = 30;

function decodeBase32(value: string): Buffer | null {
  const normalized = value.replace(/[=\s-]/g, '').toUpperCase();
  if (!normalized || !/^[A-Z2-7]+$/.test(normalized)) return null;
  let bits = 0;
  let buffer = 0;
  const output: number[] = [];
  for (const char of normalized) {
    const index = BASE32.indexOf(char);
    if (index < 0) return null;
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      output.push((buffer >> bits) & 0xff);
    }
  }
  return Buffer.from(output);
}

function codeFor(secret: Buffer, counter: number): string {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', secret).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = ((digest[offset] & 0x7f) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3];
  return String(binary % 1_000_000).padStart(6, '0');
}

export function getTotpCounter(value: string, secretValue: string, now = Date.now()): number | null {
  if (!/^\d{6}$/.test(value)) return null;
  const secret = decodeBase32(secretValue);
  if (!secret) return null;
  const counter = Math.floor(now / 1_000 / STEP_SECONDS);
  const candidate = Buffer.from(value);
  for (const offset of [-1, 0, 1]) {
    const candidateCounter = counter + offset;
    if (candidateCounter < 0) continue;
    const expected = Buffer.from(codeFor(secret, candidateCounter));
    if (candidate.length === expected.length && timingSafeEqual(candidate, expected)) return candidateCounter;
  }
  return null;
}

export function verifyTotp(value: string, secretValue: string, now = Date.now()): boolean {
  return getTotpCounter(value, secretValue, now) !== null;
}
