// Converts originals in photo-src/*.jpg into responsive AVIF + WebP in public/photos/,
// and writes src/data/photos.json (dimensions + alt text) for the <Photo> component.
import sharp from 'sharp';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'photo-src';
const OUT = 'public/photos';
const WIDTHS = [480, 800, 1200, 1600, 2400];

const meta = JSON.parse(await readFile(path.join(SRC, 'meta.json'), 'utf8'));
await mkdir(OUT, { recursive: true });
const files = new Set(await readdir(SRC));
const manifest = {};

for (const m of meta) {
  const file = `${m.slug}.jpg`;
  if (!files.has(file)) {
    console.warn(`missing ${file}`);
    continue;
  }
  const input = sharp(path.join(SRC, file)).rotate();
  const { width, height } = await input.metadata();
  const widths = WIDTHS.filter((w) => w <= width);
  if (!widths.includes(Math.min(width, 2400)) && width < 2400) widths.push(width);
  for (const w of widths) {
    const resized = input.clone().resize({ width: w, withoutEnlargement: true });
    await resized.clone().avif({ quality: 52, effort: 6 }).toFile(path.join(OUT, `${m.slug}-${w}.avif`));
    await resized.clone().webp({ quality: 72, effort: 6 }).toFile(path.join(OUT, `${m.slug}-${w}.webp`));
  }
  manifest[m.slug] = { width, height, widths, alt: m.alt };
  console.log(`${m.slug}: ${widths.join(', ')}`);
}

await writeFile('src/data/photos.json', JSON.stringify(manifest, null, 2) + '\n');
