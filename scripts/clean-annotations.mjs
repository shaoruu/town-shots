import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { humanizeId, isHandmadeAnnotation } from './humanize-id.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = join(root, 'public/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
let changed = 0;
for (const item of manifest.items) {
  const old = item.annotation || '';
  if (isHandmadeAnnotation(old)) continue;
  const next = humanizeId(item.id);
  if (next === old) continue;
  if (next) item.annotation = next;
  else delete item.annotation;
  changed++;
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`cleaned ${changed} annotations`);
