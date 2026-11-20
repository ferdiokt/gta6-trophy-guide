// Leonida Ledger hand-in (Node 22+, standard library only). The guide is app/: static files opened at
// app/index.html with no build step and no network. This program copies app/ and screenshots/ to /output
// (MAKEFUN_OUTPUT_DIR outside the grader) and writes dossier.json with the kit's unchanged buildDossier.
// Local run: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const GRADES = new Set(['platinum', 'gold', 'silver', 'bronze']);

// Refuse to hand in a trophy file the gate or the app would choke on: 55 named trophies, each with
// a grade, a non-blank guide and steps whose source indexes point at a real https source.
function assertTrophies(path: string): void {
  const doc = JSON.parse(readFileSync(path, 'utf8'));
  const list = Array.isArray(doc) ? doc : doc.trophies;
  if (!Array.isArray(list) || list.length !== 55) throw new Error(`trophies.json: expected 55 trophies, found ${list?.length}`);
  const names = new Set<string>();
  for (const t of list) {
    const where = `trophies.json "${t?.name}"`;
    if (typeof t?.name !== 'string' || names.has(t.name)) throw new Error(`${where}: missing or duplicate name`);
    names.add(t.name);
    if (!GRADES.has(t.grade)) throw new Error(`${where}: bad grade ${t.grade}`);
    if (typeof t.guide !== 'string' || !t.guide.trim()) throw new Error(`${where}: blank guide`);
    for (const s of t.steps ?? []) {
      for (const i of s.src ?? []) if (!/^https:\/\//.test(t.sources?.[i]?.url ?? '')) throw new Error(`${where}: step cites missing source ${i}`);
    }
  }
}

assertTrophies(join(here, 'app', 'data', 'trophies.json'));

// The gate's screenshot rule (RULES.txt, The gate): 3 or 4 whole PNG/JPEG files, at most 256 KiB, plain names.
function assertScreenshots(dir: string): void {
  const files = readdirSync(dir).filter((f) => !f.startsWith('.'));
  if (files.length < 3 || files.length > 4) throw new Error(`screenshots/: need 3 or 4 images, found ${files.length}`);
  for (const f of files) {
    const b = readFileSync(join(dir, f));
    const png = b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const jpg = b[0] === 0xff && b[1] === 0xd8 && b.at(-2) === 0xff && b.at(-1) === 0xd9;
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(f) || !(png || jpg) || b.length > 262144) throw new Error(`screenshots/${f}: not a valid PNG/JPEG within 256 KiB`);
  }
}

assertScreenshots(join(here, 'screenshots'));

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's caps (reference/gate.json); text_max_bytes shapes the dossier, the rest refuse what the scorer would.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
