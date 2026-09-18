#!/usr/bin/env node
// Derives wall-sized WebP thumbnails for images and first-frame posters for
// videos, then writes `thumb` / `poster` paths back into public/manifest.json.
// Idempotent: existing derived files are kept unless --force is passed.
// Requires ffmpeg with libwebp on PATH.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const manifestPath = join(publicDir, 'manifest.json');
const derivedDir = 'media/derived';
const force = process.argv.includes('--force');

const THUMB_WIDTH = 1400;
const WEBP_QUALITY = 82;
const POSTER_SEEK_SECONDS = 0.5;

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
mkdirSync(join(publicDir, derivedDir), { recursive: true });

const ffmpeg = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });

const scaleFilter = `scale='min(${THUMB_WIDTH},iw)':-2`;
const webpArgs = ['-c:v', 'libwebp', '-quality', String(WEBP_QUALITY), '-compression_level', '6'];

let changed = 0;

for (const item of manifest.items) {
  const source = join(publicDir, item.src);
  if (!existsSync(source)) {
    console.warn(`skip ${item.id}: missing ${item.src}`);
    continue;
  }

  if (item.type === 'image') {
    const thumb = `${derivedDir}/${item.id}.webp`;
    if (force || !existsSync(join(publicDir, thumb))) {
      ffmpeg(['-i', source, '-vf', scaleFilter, ...webpArgs, join(publicDir, thumb)]);
      console.log(`thumb  ${thumb}`);
    }
    if (item.thumb !== thumb) {
      item.thumb = thumb;
      changed++;
    }
  } else if (item.type === 'video') {
    const poster = `${derivedDir}/${item.id}-poster.webp`;
    if (force || !existsSync(join(publicDir, poster))) {
      ffmpeg([
        '-ss',
        String(POSTER_SEEK_SECONDS),
        '-i',
        source,
        '-frames:v',
        '1',
        '-vf',
        scaleFilter,
        ...webpArgs,
        join(publicDir, poster),
      ]);
      console.log(`poster ${poster}`);
    }
    if (item.poster !== poster) {
      item.poster = poster;
      changed++;
    }
  }
}

if (changed > 0) {
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`manifest updated (${changed} item${changed === 1 ? '' : 's'})`);
} else {
  console.log('manifest already up to date');
}
