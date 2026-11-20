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

// "Possibly missable" where the cited source has not confirmed the lockout.
export const missLabel = (t) => t.missable_label || 'Missable';
