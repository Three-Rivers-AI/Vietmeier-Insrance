// Fails if banned words, em dashes, exclamation marks in copy, italics or emoji show up in the site source.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const banned = [
  'peace of mind', "we've got you covered", 'we have got you covered', 'tailored', 'seamless',
  'navigate', 'navigating', 'journey', 'unlock', 'empower', 'comprehensive solutions', 'one-stop',
  'hassle-free', 'look no further', "in today's world", 'rest assured', 'elevate', 'leverage',
  'robust', 'cutting-edge', 'partner with us',
];

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (/\.(astro|ts|md|css|json)$/.test(e.name)) out.push(p);
  }
  return out;
}

const files = [...(await walk('src')), 'public/photos/CREDITS.md', 'README.md'];
const problems = [];
for (const f of files) {
  let text;
  try { text = await readFile(f, 'utf8'); } catch { continue; }
  text.split('\n').forEach((line, i) => {
    const where = `${f}:${i + 1}`;
    const lower = line.toLowerCase().replace(/[’]/g, "'");
    for (const b of banned) if (new RegExp(`\\b${b.replace(/[-']/g, (c) => '\\' + c)}\\b`).test(lower)) problems.push(`${where} banned "${b}"`);
    if (line.includes('—')) problems.push(`${where} em dash`);
    if (/italic/i.test(line) && !f.endsWith('check-copy.mjs')) problems.push(`${where} "italic"`);
    if (/\p{Extended_Pictographic}/u.test(line.replace(/[©®™]/g, ''))) problems.push(`${where} emoji`);
    // Exclamation marks in copy. Skip code operators like !== and !x.
    if (!/\.(ts|css|json)$/.test(f)) {
      const stripped = line.replace(/<!--.*?-->|<!doctype[^>]*>/gi, '').replace(/!(=|\w|\(|\[|\s*\w+\.)/g, '');
      if (/[A-Za-z.)]\s*!(\s|$|<)/.test(stripped)) problems.push(`${where} exclamation mark`);
    }
  });
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} copy problem(s).`);
  process.exit(1);
}
console.log(`Copy check passed on ${files.length} files.`);
