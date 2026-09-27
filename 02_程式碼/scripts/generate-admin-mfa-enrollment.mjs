#!/usr/bin/env node
import { chmod, writeFile } from 'node:fs/promises';
import { randomBytes, randomInt } from 'node:crypto';
import { resolve } from 'node:path';

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const [, , outputArg, usernameArg = process.env.ADMIN_USERNAME || 'tiancinge'] = process.argv;
if (!outputArg) throw new Error('Usage: node scripts/generate-admin-mfa-enrollment.mjs /secure/path/enrollment.json [username]');
const username = usernameArg.trim().toLowerCase();
if (!/^[a-z0-9_-]{4,32}$/.test(username)) throw new Error('Invalid admin username');

function base32(bytes) {
  let bits = 0;
  let buffer = 0;
  let value = '';
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      value += BASE32[(buffer >> bits) & 31];
    }
  }
  if (bits > 0) value += BASE32[(buffer << (5 - bits)) & 31];
  return value;
}

function recoveryCode() {
  let result = '';
  for (let index = 0; index < 16; index += 1) result += ALPHABET[randomInt(ALPHABET.length)];
  return result.match(/.{4}/g).join('-');
}

const secret = base32(randomBytes(20));
const recoveryCodes = Array.from({ length: 10 }, recoveryCode);
const output = resolve(outputArg);
const enrollment = {
  generatedAt: new Date().toISOString(),
  username,
  issuer: '天心閣養生會館',
  otpauthUri: `otpauth://totp/${encodeURIComponent(`天心閣養生會館:${username}`)}?secret=${secret}&issuer=${encodeURIComponent('天心閣養生會館')}&algorithm=SHA1&digits=6&period=30`,
  secret,
  recoveryCodes,
  note: '只在已驗證的管理員裝置上開啟一次；完成 Secret Manager 與 Firestore 註冊後立即刪除此檔案。',
};

await writeFile(output, `${JSON.stringify(enrollment, null, 2)}\n`, { mode: 0o600 });
await chmod(output, 0o600);
process.stdout.write(`MFA enrollment written to ${output}; ${recoveryCodes.length} recovery codes generated.\n`);
process.stdout.write('此工具不會自動寫入 Secret Manager 或 Firestore；請依資料安全交接流程完成註冊後刪除檔案。\n');
