// The platinum roadmap: stages in the order to play them, then every missable trophy with its warning.
import { el, gradeBadge, KIND_LABEL } from './dom.js';
import { isShielded } from './spoilers.js';

export const ROADMAP_SOURCE = { name: 'PowerPyx roadmap', url: 'https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/' };

export const STAGES = [
  { title: 'Story run', plan: 'Five chapters, about 60 to 80 hours. Story trophies are automatic, but missions cannot be replayed: keep a manual save before the finale.' },
  { title: 'Strangers', plan: 'Finish whole stranger strands: 8 for Strangers & Freaks, with Andy, Kenton, Billy, Randy and Tyrone each worth a trophy.' },
  { title: 'Crime', plan: 'Robberies, vaults, gang operations and laundering, several with your partner along; partner free roam opens after Coffee Break.' },
  { title: 'Activities and oddities', plan: 'Races, stunts, ranges, drones and arcades, plus one-off feats, garages and spending. Everything stays open in free roam.' },
  { title: 'Collectibles and 100%', plan: 'Cards, WAiNK scans, vehicles and the map fog, then the lenient 100% checklist (about 60% of everything).' },
  { title: 'Platinum', plan: 'Every other trophy earned unlocks the platinum. No online or DLC trophy is on the list.' },
];

function stageItem(t, progress, on) {
  const shut = isShielded(t, progress);
  const earned = Boolean(progress.earned[t.name]);
  return el('li', { class: `stage-item${earned ? ' is-earned' : ''}` },
    el('button', { type: 'button', class: 'stage-link', onclick: () => on.open(t.name) },
      el('span', { class: 'stage-check', 'aria-hidden': 'true' }, earned ? '✓' : ''),
      el('span', { class: 'stage-name' }, shut ? 'Hidden trophy' : t.name),
      t.missable && !shut ? el('span', { class: 'tag tag-miss' }, 'Missable') : null,
      gradeBadge(t.grade)));
}

export function renderRoadmap(root, trophies, progress, on) {
  const bills = STAGES.map((s, i) => {
    const items = trophies.filter((t) => t.stage === i + 1);
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
    el('h2', { id: 'miss-title', class: 'miss-title' }, `Missable: ${missables.length}`),
    el('p', { class: 'miss-lede' }, 'Built from the official descriptions and the cited guides. Each warning says when the window closes.'),
    el('ul', { class: 'miss-list' }, missables.map((t) => {
      const shut = isShielded(t, progress);
      return el('li', { class: progress.earned[t.name] ? 'is-earned' : '' },
        el('button', { type: 'button', class: 'stage-link', onclick: () => on.open(t.name) },
          el('span', { class: 'miss-name' }, shut ? 'Hidden trophy' : t.name),
          gradeBadge(t.grade)),
        el('p', { class: 'miss-why' }, shut ? `${KIND_LABEL[t.kind]} trophy in stage ${t.stage}. Reveal it to read the warning.` : t.missable));
    })));

  root.replaceChildren(el('div', { class: 'bills' }, bills), el('div', { class: 'road-side' }, strip,
    el('p', { class: 'road-src' }, 'Stage plan from ',
      el('a', { href: ROADMAP_SOURCE.url, target: '_blank', rel: 'noopener noreferrer' }, ROADMAP_SOURCE.name),
      ', in our words. Story trophies unlock on their own and cannot be missed.')));
}
