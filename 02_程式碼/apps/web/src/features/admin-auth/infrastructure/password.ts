import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const VERSION = 'v1';
const N = 16_384;
const R = 8;
const P = 1;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

export type PasswordHash = `scrypt$${string}`;

export function createPasswordHash(password: string): PasswordHash {
  if (password.length < 8 || password.length > 256) throw new Error('密碼長度必須介於 8–256 個字元');
  const salt = randomBytes(SALT_LENGTH);
  const derived = scryptSync(password, salt, KEY_LENGTH, { N, r: R, p: P, maxmem: 32 * 1024 * 1024 });
  return `scrypt$${VERSION}$N=${N},r=${R},p=${P}$${salt.toString('base64url')}$${derived.toString('base64url')}` as PasswordHash;
}

function decode(value: string): Buffer {
  const decoded = Buffer.from(value, 'base64url');
  if (!decoded.length) throw new Error('invalid hash encoding');
  return decoded;
}

export function verifyPassword(password: string, encoded: string): boolean {
  try {
    const [algorithm, version, parameters, saltEncoded, hashEncoded] = encoded.split('$');
    if (algorithm !== 'scrypt' || version !== VERSION || parameters !== `N=${N},r=${R},p=${P}` || !saltEncoded || !hashEncoded) return false;
    const salt = decode(saltEncoded);
    const expected = decode(hashEncoded);
    if (salt.length !== SALT_LENGTH || expected.length !== KEY_LENGTH) return false;
    const actual = scryptSync(password, salt, KEY_LENGTH, { N, r: R, p: P, maxmem: 32 * 1024 * 1024 });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// A fixed valid hash keeps unknown-account checks on the same code path.
// It is not a usable credential and contains no production secret.
export const DUMMY_PASSWORD_HASH: PasswordHash = 'scrypt$v1$N=16384,r=8,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
