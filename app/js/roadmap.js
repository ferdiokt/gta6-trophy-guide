// The platinum roadmap: stages in the order to play them, then every missable trophy with its warning.
import { el, gradeBadge, missLabel, missStatus, isAtRisk, citeChips, KIND_LABEL, GRADE_LABEL } from './dom.js';
import { isShielded } from './spoilers.js';

export const ROADMAP_SOURCE = { name: 'PowerPyx roadmap', url: 'https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/' };

export const STAGES = [
  { title: 'Story run', plan: 'Take Lucia\'s Chapter 1 meditation. Save before the finale.' },
  { title: 'Strangers', plan: 'Whole strands count; all stay open after the story.' },
  { title: 'Crime', plan: 'Partner jobs open after Coffee Break (Ch 2).' },
  { title: 'Activities', plan: 'Races, stunts, ranges, drones and one-off feats.' },
  { title: 'Cleanup and 100%', plan: 'Cards, scans, map and garages, then the 100% list.' },
  { title: 'Platinum', plan: 'The other 54 unlock it. No online or DLC trophy on the list.' },
];

function stageItem(t, progress, on) {
  const shut = isShielded(t, progress);
  const earned = Boolean(progress.earned[t.name]);
  return el('li', { class: `stage-item${earned ? ' is-earned' : ''}` },
    el('button', { type: 'button', class: 'stage-link', onclick: () => on.open(t.name) },
      el('span', { class: 'stage-check', 'aria-hidden': 'true' }, earned ? '✓' : ''),
      el('span', { class: 'stage-name' }, shut ? 'Hidden trophy' : t.name),
      t.chapter ? el('span', { class: 'tag' }, `Ch ${t.chapter}`) : null,
      t.count && t.count < 1000 && !shut ? el('span', { class: 'stage-count' }, `×${t.count}`) : null,
      isAtRisk(t) && !shut ? el('span', { class: `tag tag-miss tag-${missStatus(t)}`, title: missLabel(t) }, missStatus(t) === 'missable' ? '!' : '?') : null,
      el('span', { class: `grade grade-${t.grade} grade-mark`, title: `${GRADE_LABEL[t.grade]} trophy` }, GRADE_LABEL[t.grade][0])));
}

export function renderRoadmap(root, trophies, progress, on) {
  const bills = STAGES.map((s, i) => {
    // story order: by chapter (from the cited guides), then list order
    const items = trophies.filter((t) => t.stage === i + 1).sort((a, b) => (a.chapter ?? 9) - (b.chapter ?? 9) || a.id - b.id);
    const done = items.filter((t) => progress.earned[t.name]).length;
    return el('section', { class: `bill bill-${i % 2 ? 'b' : 'a'}`, 'aria-labelledby': `stage-${i + 1}` },
      el('div', { class: 'bill-head' },
        el('span', { class: 'bill-num', 'aria-hidden': 'true' }, String(i + 1)),
        el('div', {}, el('h2', { id: `stage-${i + 1}`, class: 'bill-title' }, s.title),
          el('p', { class: 'bill-count' }, `${done} of ${items.length} earned`))),
      el('p', { class: 'bill-plan' }, s.plan),
      el('ol', { class: 'stage-list' }, items.map((t) => stageItem(t, progress, on))));
  });

  // Every trophy has a verdict; the strip lists the ones that are not plainly safe, in play order.
  const tally = (s) => trophies.filter((t) => missStatus(t) === s).length;
  const atRisk = trophies.filter(isAtRisk).sort((a, b) => (a.chapter ?? 9) - (b.chapter ?? 9));
  const strip = el('section', { class: 'missables', 'aria-labelledby': 'miss-title' },
    el('h2', { id: 'miss-title', class: 'miss-title' },
      `Missable check: ${tally('missable')} missable, ${tally('unconfirmed')} unconfirmed, ${tally('safe')} not missable`),
    el('ul', { class: 'miss-list' }, atRisk.map((t) => {
      const shut = isShielded(t, progress);
      return el('li', { class: progress.earned[t.name] ? 'is-earned' : '' },
        el('button', { type: 'button', class: 'stage-link', onclick: () => on.open(t.name) },
          el('span', { class: 'miss-name' }, shut ? 'Hidden trophy' : t.name),
          el('span', { class: `tag tag-${missStatus(t)}` }, missLabel(t)), gradeBadge(t.grade)),
        shut ? el('p', { class: 'miss-why' }, `${KIND_LABEL[t.kind]} trophy in stage ${t.stage}. Reveal it to read the warning.`)
          : el('p', { class: 'miss-why' }, el('strong', {}, `${t.miss.where}. `), t.miss.note, ' ', ...citeChips(t.miss.src, t.sources)));
    })));

  root.replaceChildren(el('div', { class: 'road-top' }, strip,
    el('p', { class: 'road-src' }, 'Six stages in play order, each sorted by the chapter it opens in. ! missable, ? unconfirmed, ×N the count to reach, P G S B the grade. Every guide gives its own missable verdict and source. Stages from ',
      el('a', { href: ROADMAP_SOURCE.url, target: '_blank', rel: 'noopener noreferrer' }, ROADMAP_SOURCE.name),
      ' and GTABase, in our words.')), el('div', { class: 'bills' }, bills));
}
