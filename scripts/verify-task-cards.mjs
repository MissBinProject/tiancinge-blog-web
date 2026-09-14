#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const taskDir = path.join(root, '02_規劃書', 'project', 'luna-tasks');
const expected = [];
for (const phase of ['A', 'B', 'C', 'D', 'E']) {
  const max = phase === 'A' ? 7 : phase === 'B' ? 10 : phase === 'C' ? 18 : phase === 'D' ? 17 : 11;
  for (let index = 1; index <= max; index += 1) expected.push(`${phase}${String(index).padStart(2, '0')}`);
}

const files = (await readdir(taskDir)).filter((file) => /^[A-E]-.*\.md$/.test(file)).sort();
const cards = [];
const missing = [];

for (const file of files) {
  const source = await readFile(path.join(taskDir, file), 'utf8');
  const headings = [...source.matchAll(/^##\s+([A-E]\d{2})\s+.+$/gm)];
  headings.forEach((heading, index) => {
    const start = heading.index ?? 0;
    const end = headings[index + 1]?.index ?? source.length;
    const card = source.slice(start, end);
    const id = heading[1];
    cards.push(id);
    const fields = [
      ['參考圖', /參考圖：/],
      ['目標', /目標：/],
      ['前置任務', /前置任務：/],
      ['修改範圍', /(?:允許修改|可修改範圍)：/],
      ['固定契約', /固定契約：/],
      ['步驟', /步驟：/],
      ['驗收', /驗收：/],
      ['交接紀錄', /交接紀錄：/],
    ];
    for (const [label, pattern] of fields) {
      if (!pattern.test(card)) missing.push(`${id}:${label}`);
    }
    if (/交接紀錄：完成後記錄執行日期/.test(card)) missing.push(`${id}:交接紀錄尚未填寫`);
  });
}

const duplicates = cards.filter((id, index) => cards.indexOf(id) !== index);
const unexpected = cards.filter((id) => !expected.includes(id));
const absent = expected.filter((id) => !cards.includes(id));
if (missing.length || duplicates.length || unexpected.length || absent.length || cards.length !== expected.length) {
  console.error('Luna task-card verification failed.');
  if (missing.length) console.error(`Missing fields: ${missing.join(', ')}`);
  if (duplicates.length) console.error(`Duplicate IDs: ${[...new Set(duplicates)].join(', ')}`);
  if (unexpected.length) console.error(`Unexpected IDs: ${[...new Set(unexpected)].join(', ')}`);
  if (absent.length) console.error(`Absent IDs: ${absent.join(', ')}`);
  process.exit(1);
}

console.log(`Luna task-card verification passed (${cards.length} cards; all required fields present).`);
