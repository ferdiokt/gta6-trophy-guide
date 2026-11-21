// Tiny element builder: el('p', { class: 'x', onclick }, 'text', child). Text goes in as text nodes, never HTML.
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'class') node.className = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null && c !== false) node.append(c);
  return node;
}

export const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
export const KIND_LABEL = {
  story: 'Story', side: 'Strangers', crime: 'Crime', activity: 'Activity', collectible: 'Collectible', misc: 'Misc',
};

export function gradeBadge(grade) {
  return el('span', { class: `grade grade-${grade}`, title: `${GRADE_LABEL[grade]} trophy` }, GRADE_LABEL[grade]);
}

// Every trophy carries miss.status: missable (a part can be lost for good), unconfirmed (no source settles it) or safe.
export const MISS_LABEL = { missable: 'Missable', unconfirmed: 'Unconfirmed', safe: 'Not missable' };
export const missStatus = (t) => t.miss?.status ?? 'safe';
export const isAtRisk = (t) => missStatus(t) !== 'safe';
export const missLabel = (t) => MISS_LABEL[missStatus(t)];

// Links to the sources a step or a miss record cites by index, each chip named for its source.
export function citeChips(indexes, sources) {
  return (indexes || []).map((i) => el('a', {
    class: 'cite', href: sources[i].url, target: '_blank', rel: 'noopener noreferrer', title: sources[i].url,
  }, sources[i].name));
}
