#!/usr/bin/env node
import crypto from 'node:crypto';

function readSecret(prompt) {
  const input = process.stdin;
  return new Promise((resolve, reject) => {
    let value = '';
    const wasRaw = Boolean(input.isRaw);
    const cleanup = () => {
      input.off('data', onData);
      if (input.isTTY && !wasRaw) input.setRawMode(false);
      input.pause();
    };
    const onData = (chunk) => {
      const text = String(chunk);
      if (text === '\u0003') {
        cleanup();
        reject(new Error('cancelled'));
        return;
      }
      for (const char of text) {
        if (char === '\r' || char === '\n') {
          cleanup();
          process.stderr.write('\n');
          resolve(value);
        } else if (char === '\u007f' || char === '\b') {
          value = value.slice(0, -1);
        } else {
          value += char;
        }
      }
    };
    process.stderr.write(prompt);
    if (input.isTTY) input.setRawMode(true);
    input.setEncoding('utf8');
    input.resume();
    input.on('data', onData);
  });
}

try {
  const first = await readSecret('New admin password: ');
  const second = await readSecret('Repeat password: ');
  if (first.length < 8) throw new Error('password must contain at least 8 characters');
  if (first !== second) throw new Error('passwords do not match');
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(first, salt, 32, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  process.stdout.write(`scrypt$v1$N=16384,r=8,p=1$${salt.toString('base64url')}$${derived.toString('base64url')}\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : 'unable to create hash'}\n`);
  process.exitCode = 1;
}
