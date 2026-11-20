// The platinum roadmap: stages in the order to play them, then every missable trophy with its warning.
import { el, gradeBadge, missLabel, KIND_LABEL, GRADE_LABEL } from './dom.js';
import { isShielded } from './spoilers.js';

export const ROADMAP_SOURCE = { name: 'PowerPyx roadmap', url: 'https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/' };

export const STAGES = [
  { title: 'Story run', plan: 'Five chapters, 60 to 80 hours. No mission replay: save before the finale.' },
  { title: 'Strangers', plan: 'Whole strands count; five named strangers pay a trophy each.' },
  { title: 'Crime', plan: 'Robberies, vaults and gangs; partner jobs open after Coffee Break.' },
  { title: 'Activities and oddities', plan: 'Races, stunts, ranges, drones and one-off feats, all open in free roam.' },
  { title: 'Cleanup and 100%', plan: 'Collectibles, garages and spending, then the lenient 100% checklist.' },
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
      t.missable && !shut ? el('span', { class: 'tag tag-miss', title: missLabel(t) }, '!') : null,
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

  const missables = trophies.filter((t) => t.missable);
  const strip = el('section', { class: 'missables', 'aria-labelledby': 'miss-title' },
    el('h2', { id: 'miss-title', class: 'miss-title' }, `Missable watch: ${missables.length}`),
    el('ul', { class: 'miss-list' }, missables.map((t) => {
      const shut = isShielded(t, progress);
      return el('li', { class: progress.earned[t.name] ? 'is-earned' : '' },
        el('button', { type: 'button', class: 'stage-link', onclick: () => on.open(t.name) },
          el('span', { class: 'miss-name' }, shut ? 'Hidden trophy' : t.name),
          el('span', { class: 'tag' }, missLabel(t)), gradeBadge(t.grade)),
        el('p', { class: 'miss-why' }, shut ? `${KIND_LABEL[t.kind]} trophy in stage ${t.stage}. Reveal it to read the warning.` : t.missable));
    })));

  root.replaceChildren(el('div', { class: 'road-top' }, strip,
    el('p', { class: 'road-src' }, 'Six stages in play order; P, G, S, B mark the grade. Missable flags come from the official descriptions and the cited guides. Stage plan from ',
      el('a', { href: ROADMAP_SOURCE.url, target: '_blank', rel: 'noopener noreferrer' }, ROADMAP_SOURCE.name),
      ', in our words. Story trophies unlock on their own and cannot be missed; ! marks a missable.')), el('div', { class: 'bills' }, bills));
}
