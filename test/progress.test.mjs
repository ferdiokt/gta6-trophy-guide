// node --test test/  — checks the progress file rules the import dialog relies on.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { emptyProgress, setEarned, setCounter, buildExport, parseImport, applyImport, importSummary } from '../app/js/progress.js';
import { isShielded, searchableText } from '../app/js/spoilers.js';

const { trophies } = JSON.parse(readFileSync(new URL('../app/data/trophies.json', import.meta.url)));
const counted = trophies.find((t) => t.count);

function sample() {
  const p = emptyProgress();
  setEarned(p, trophies[1].name, true, new Date('2026-11-20T10:00:00Z'));
  setEarned(p, trophies[2].name, true, new Date('2026-11-20T11:00:00Z'));
  setCounter(p, counted, 7);
  p.revealed.push(trophies[3].name);
  p.settings.spoilerShield = false;
  return p;
}

test('export, reset, import (replace) gives the same state back', () => {
  const before = sample();
  const text = JSON.stringify(buildExport(before));
  const reset = emptyProgress();
  const { progress, ignored } = parseImport(text, trophies);
  assert.deepEqual(ignored, []);
  assert.deepEqual(applyImport(reset, progress, 'replace'), before);
});

test('bad JSON and foreign files are refused', () => {
  assert.throws(() => parseImport('{nope', trophies), /not valid JSON/);
  assert.throws(() => parseImport('{"earned":[]}', trophies), /not a Leonida Ledger/);
  assert.throws(() => parseImport(JSON.stringify({ ...buildExport(emptyProgress()), version: 9 }), trophies), /version 9/);
});

test('unknown names are ignored and reported', () => {
  const file = buildExport(sample());
  file.earned.push({ name: 'Not A Trophy', at: '2026-11-20T00:00:00Z' }, { name: 'Also Fake' });
  const result = parseImport(JSON.stringify(file), trophies);
  assert.deepEqual(result.ignored.sort(), ['Also Fake', 'Not A Trophy']);
  assert.match(importSummary(result), /^2 earned, 2 ignored$/);
});

test('merge keeps the earliest time and the higher counter', () => {
  const mine = emptyProgress();
  setEarned(mine, trophies[1].name, true, new Date('2026-11-19T00:00:00Z'));
  setCounter(mine, counted, 9);
  const merged = applyImport(mine, sample(), 'merge');
  assert.equal(merged.earned[trophies[1].name], '2026-11-19T00:00:00.000Z');
  assert.equal(merged.counters[counted.name], 9);
  assert.ok(merged.earned[trophies[2].name]);
});

test('shielded trophies never match by name in search', () => {
  const p = emptyProgress();
  const story = trophies.find((t) => t.kind === 'story');
  assert.ok(isShielded(story, p));
  assert.ok(!searchableText(story, p).includes(story.name.toLowerCase()));
  setEarned(p, story.name, true);
  assert.ok(!isShielded(story, p));
});

test('data: 55 trophies, every guide has steps, every cited step names a real source', () => {
  assert.equal(trophies.length, 55);
  for (const t of trophies) {
    assert.ok(t.guide.trim() && t.steps.length, t.name);
    for (const s of t.steps) for (const i of s.src || []) assert.ok(t.sources[i]?.url.startsWith('https://'), `${t.name} step source ${i}`);
  }
});

test('data check: the file matches the official totals, with 2+ source sites and a sourced missable verdict each', async () => {
  const { dataChecks } = await import('../app/js/datacheck.js');
  for (const row of dataChecks(trophies)) assert.ok(row.ok, `${row.label}: ${row.got} vs ${row.want}`);
  const bad = structuredClone(trophies);
  bad[1].grade = 'gold';
  delete bad[2].miss;
  assert.deepEqual(dataChecks(bad).filter((r) => !r.ok).map((r) => r.label), ['gold', 'bronze', 'Missable verdict with its source']);
});
