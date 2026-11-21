// The checklist: filter chips, the ruled trophy list, and the open trophy's cited guide beside it.
import { el, gradeBadge, missLabel, missStatus, isAtRisk, citeChips, KIND_LABEL, GRADE_LABEL } from './dom.js';
import { isShielded, searchableText } from './spoilers.js';

export const FILTERS = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'story', label: 'Story', test: (t) => t.kind === 'story' },
  { key: 'missable', label: 'Missable', test: isAtRisk },
  { key: 'collectible', label: 'Collectibles', test: (t) => t.kind === 'collectible' },
  { key: 'activity', label: 'Activities', test: (t) => t.kind === 'activity' },
  { key: 'side', label: 'Strangers', test: (t) => t.kind === 'side' },
  { key: 'crime', label: 'Crime', test: (t) => t.kind === 'crime' },
  { key: 'online', label: 'Online', test: (t) => t.kind === 'online' },
];

export function visibleTrophies(trophies, progress, view) {
  const filter = FILTERS.find((f) => f.key === view.filter) ?? FILTERS[0];
  const q = view.query.trim().toLowerCase();
  return trophies.filter((t) => filter.test(t)
    && (view.status === 'all' || (view.status === 'earned') === Boolean(progress.earned[t.name]))
    && (!q || searchableText(t, progress).includes(q)));
}

export function renderFilters(root, trophies, progress, view, on) {
  root.replaceChildren(...FILTERS.map((f) => {
    const n = trophies.filter(f.test).length;
    return el('button', {
      type: 'button', class: 'chip', 'aria-pressed': String(view.filter === f.key), disabled: n === 0,
      title: n === 0 ? 'The official list has no online trophies' : null,
      onclick: () => on.filter(f.key),
    }, f.label, el('span', { class: 'chip-n' }, String(n)));
  }));
}

function counterText(t, progress) {
  const v = progress.counters[t.name] || 0;
  return t.count >= 1000 ? `$${v.toLocaleString('en-US')} / $${t.count.toLocaleString('en-US')}` : `${v} / ${t.count}`;
}

export function renderList(root, list, progress, view, on) {
  if (!list.length) {
    root.replaceChildren(el('li', { class: 'empty' }, 'No trophy matches this filter and search. ',
      el('button', { type: 'button', class: 'link', onclick: on.clearFilters }, 'Clear filters')));
    return;
  }
  root.replaceChildren(...list.map((t) => {
    const shut = isShielded(t, progress);
    const earned = Boolean(progress.earned[t.name]);
    return el('li', { class: `row${earned ? ' is-earned' : ''}${view.selected === t.name ? ' is-open' : ''}${shut ? ' is-shut' : ''}` },
      el('input', {
        type: 'checkbox', class: 'tick', checked: earned, 'aria-label': `Earned: ${shut ? 'hidden trophy' : t.name}`,
        onchange: (e) => on.earn(t.name, e.target.checked),
      }),
      el('button', { type: 'button', class: 'row-main', onclick: () => on.select(t.name), 'aria-expanded': String(view.selected === t.name) },
        el('span', { class: 'row-name' }, shut ? 'Hidden trophy' : t.name),
        el('span', { class: 'row-desc' }, shut ? `${KIND_LABEL[t.kind]} trophy, hidden until earned` : t.description)),
      el('span', { class: 'row-meta' },
        gradeBadge(t.grade),
        el('span', { class: 'tag' }, KIND_LABEL[t.kind]),
        isAtRisk(t) && !shut ? el('span', { class: `tag tag-miss tag-${missStatus(t)}` }, missLabel(t)) : null,
        t.count && !shut ? el('span', { class: 'tag tag-count' }, counterText(t, progress)) : null,
        shut ? el('button', { type: 'button', class: 'reveal', onclick: () => on.reveal(t.name) }, 'Reveal') : null));
  }));
}

// The missable verdict for one trophy, with the chapter it hangs on and the sources behind it.
function missNote(t) {
  const m = t.miss;
  if (!m) return null;
  return el('div', { class: `miss-note miss-${m.status}` },
    el('p', {}, el('strong', {}, `${missLabel(t)}${m.where ? `: ${m.where}` : ''}. `), m.note, ' ', ...citeChips(m.src, t.sources)));
}

export function renderDetail(root, t, progress, stages, on) {
  if (!t) { root.replaceChildren(el('p', { class: 'detail-empty' }, 'Pick a trophy to open its guide.')); return; }
  const shut = isShielded(t, progress);
  const earned = Boolean(progress.earned[t.name]);
  const head = el('header', { class: 'detail-head' },
    el('div', { class: 'detail-meta' }, gradeBadge(t.grade), el('span', { class: 'tag' }, KIND_LABEL[t.kind]),
      el('span', { class: 'tag' }, `Stage ${t.stage}: ${stages[t.stage - 1].title}`),
      t.chapter ? el('span', { class: 'tag' }, t.kind === 'story' ? `Chapter ${t.chapter}` : `From chapter ${t.chapter}`) : null),
    el('h2', { class: 'detail-name' }, shut ? 'Hidden trophy' : t.name),
    el('p', { class: 'detail-desc' }, shut ? `A ${GRADE_LABEL[t.grade].toLowerCase()} ${KIND_LABEL[t.kind].toLowerCase()} trophy. Its name, description and guide stay hidden while the spoiler shield is on.` : t.description));

  if (shut) {
    root.replaceChildren(head, el('details', { class: 'guide-shut' },
      el('summary', {}, 'Guide hidden'), el('p', {}, 'Reveal it to read the guide.')),
    el('div', { class: 'detail-actions' },
      el('button', { type: 'button', class: 'btn btn-primary', onclick: () => on.reveal(t.name) }, 'Reveal'),
      el('button', { type: 'button', class: 'btn', onclick: () => on.earn(t.name, true) }, 'Mark earned')));
    return;
  }

  const parts = [head];
  parts.push(missNote(t));
  if (t.count) {
    const v = progress.counters[t.name] || 0;
    const step = t.count >= 1000 ? 5000 : 1;
    parts.push(el('div', { class: 'counter' },
      el('span', { class: 'counter-label' }, 'Your count'),
      el('button', { type: 'button', class: 'btn btn-sq', 'aria-label': 'Decrease', onclick: () => on.count(t, v - step) }, '−'),
      el('input', { type: 'number', min: 0, max: t.count, value: v, step, 'aria-label': `Count toward ${t.count}`, onchange: (e) => on.count(t, e.target.value) }),
      el('span', { class: 'counter-of' }, `of ${t.count.toLocaleString('en-US')}`),
      el('button', { type: 'button', class: 'btn btn-sq', 'aria-label': 'Increase', onclick: () => on.count(t, v + step) }, '+'),
      el('span', { class: 'meter', style: `--fill:${(v / t.count).toFixed(3)}` })));
  }
  // Mark earned sits above the guide so it stays in view however long the steps run.
  parts.push(el('div', { class: 'detail-actions' },
    el('button', { type: 'button', class: `btn ${earned ? '' : 'btn-primary'}`, onclick: () => on.earn(t.name, !earned) }, earned ? 'Mark not earned' : 'Mark earned'),
    earned ? el('span', { class: 'earned-at' }, `Earned ${new Date(progress.earned[t.name]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`) : null));
  parts.push(el('h3', { class: 'guide-title' }, 'How to earn it'));
  parts.push(el('ol', { class: 'steps' }, t.steps.map((s) => el('li', {}, s.text, ' ', ...citeChips(s.src, t.sources)))));
  parts.push(el('div', { class: 'sources' },
    el('h3', { class: 'guide-title' }, t.sources.length ? `Sources (${t.sources.length})` : 'No source yet'),
    t.sources.length
      ? el('ul', {}, t.sources.map((s) => el('li', {}, el('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, s.name), el('span', { class: 'src-url' }, ` ${new URL(s.url).hostname.replace(/^www\./, '')}`))))
      : el('p', {}, 'No public guide covers this trophy yet, so the steps above say only what its official description implies.')));
  root.replaceChildren(...parts);
}
