// The data check: counts the loaded trophy file against PlayStation's published totals, live in the
// browser, so a reader sees the list is whole: grades, hidden flags, cited sources and missable verdicts.
import { el, gradeBadge, MISS_LABEL, missStatus } from './dom.js';
import { FILTERS } from './checklist.js';

// PlayStation's published PS5 list (the bounty's trophy list, as Exophase and PSNProfiles show it).
export const OFFICIAL = { trophies: 55, platinum: 1, gold: 2, silver: 6, bronze: 46, hidden: 28 };
const GRADES = ['platinum', 'gold', 'silver', 'bronze'];

const host = (url) => new URL(url).hostname.replace(/^www\./, '');
const filled = (s) => typeof s === 'string' && s.trim() !== '';

// One row per check: what the file holds, what it should hold, and whether they agree.
export function dataChecks(trophies) {
  const count = (test) => trophies.filter(test).length;
  const n = trophies.length;
  return [
    { label: 'Trophies', got: n, want: OFFICIAL.trophies },
    ...GRADES.map((g) => ({ label: g, grade: g, got: count((t) => t.grade === g), want: OFFICIAL[g] })),
    { label: 'Hidden on PlayStation', got: count((t) => t.hidden === true), want: OFFICIAL.hidden },
    { label: 'Official name, description and grade', got: count((t) => filled(t.name) && filled(t.description) && GRADES.includes(t.grade)), want: n },
    { label: 'Guides citing 2+ independent sites', got: count((t) => new Set((t.sources || []).map((s) => host(s.url))).size >= 2), want: n },
    { label: 'Missable verdict with its source', got: count((t) => t.miss && MISS_LABEL[t.miss.status] && t.miss.src?.length > 0), want: n },
  ].map((row) => ({ ...row, ok: row.got === row.want }));
}

export function renderDataCheck(trophies, progress, onClose) {
  const rows = dataChecks(trophies);
  const allOk = rows.every((r) => r.ok);
  const verdicts = Object.keys(MISS_LABEL).map((s) => `${trophies.filter((t) => missStatus(t) === s).length} ${MISS_LABEL[s].toLowerCase()}`);
  const kinds = FILTERS.filter((f) => f.key !== 'all').map((f) => el('li', {}, f.label, ' ', el('b', {}, String(trophies.filter(f.test).length))));
  const earned = Object.keys(progress.earned).length;

  return el('section', { class: 'side-panel check', 'aria-labelledby': 'check-title' },
    el('header', { class: 'side-head' },
      el('h2', { id: 'check-title', class: 'side-title', tabindex: -1 }, 'Data check'),
      el('button', { type: 'button', class: 'btn btn-quiet', onclick: onClose }, 'Back to the guide')),
    el('p', { class: `check-verdict${allOk ? ' is-ok' : ' is-off'}` },
      allOk ? 'Matches the official list' : 'Does not match the official list'),
    el('p', { class: 'check-sum' }, `${OFFICIAL.trophies} = ${OFFICIAL.platinum} P + ${OFFICIAL.gold} G + ${OFFICIAL.silver} S + ${OFFICIAL.bronze} B`),
    el('table', { class: 'check-table' },
      el('thead', {}, el('tr', {}, el('th', { scope: 'col' }, 'Counted in data/trophies.json'), el('th', { scope: 'col' }, 'Here'), el('th', { scope: 'col' }, 'Should be'), el('th', { scope: 'col' }, el('span', { class: 'visually-hidden' }, 'Result')))),
      el('tbody', {}, rows.map((r) => el('tr', { class: r.ok ? '' : 'is-off' },
        el('th', { scope: 'row' }, r.grade ? gradeBadge(r.grade) : r.label),
        el('td', {}, String(r.got)), el('td', {}, String(r.want)),
        el('td', { class: 'check-mark' }, r.ok ? '✓' : '✗'))))),
    el('p', { class: 'check-line' }, el('strong', {}, 'Missable verdicts: '), verdicts.join(', '), '.'),
    el('div', { class: 'check-line' }, el('strong', {}, 'Filters: '), el('ul', { class: 'check-kinds' }, kinds)),
    el('p', { class: 'check-line' }, el('strong', {}, 'Saved in this browser: '), `${earned} earned, ${Object.keys(progress.counters).length} counters, spoiler shield ${progress.settings.spoilerShield ? 'on' : 'off'}.`));
}
