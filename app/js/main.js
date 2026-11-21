// Boot: load the trophy list, restore progress, wire the top bar, tabs and views, re-render on change.
import { el } from './dom.js';
import { loadProgress, saveProgress, setEarned, setCounter } from './progress.js';
import { renderFilters, renderList, renderDetail, visibleTrophies } from './checklist.js';
import { renderRoadmap, STAGES } from './roadmap.js';
import { downloadExport, startImport, confirmReset } from './transfer.js';
import { renderDataCheck } from './datacheck.js';

const $ = (id) => document.getElementById(id);
const GRADES = ['platinum', 'gold', 'silver', 'bronze'];

let progress = loadProgress();
// panel: null shows the open trophy's guide; 'check' the data check; an element (the import review) as given.
const view = { filter: 'all', status: 'all', query: '', selected: null, tab: 'checklist', panel: null };
let trophies = [];
let statusTimer;

function say(text) {
  $('status').textContent = text;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { $('status').textContent = ''; }, 6000);
}

function commit() {
  saveProgress(progress);
  render();
}

const on = {
  earn(name, yes) { setEarned(progress, name, yes); commit(); },
  reveal(name) { if (!progress.revealed.includes(name)) progress.revealed.push(name); view.selected = name; commit(); },
  select(name) { view.selected = name; view.panel = null; render(); },
  count(t, v) { setCounter(progress, t, v); commit(); },
  filter(key) { view.filter = key; render(); },
  clearFilters() { Object.assign(view, { filter: 'all', status: 'all', query: '' }); $('search').value = ''; render(); },
  open(name) { view.selected = name; view.panel = null; showTab('checklist'); },
};

function renderTally() {
  const n = (list) => list.filter((t) => progress.earned[t.name]).length;
  const done = n(trophies);
  $('tally').replaceChildren(
    el('p', { class: 'tally-big' }, el('span', { class: 'tally-n' }, String(done)), el('span', { class: 'tally-of' }, `/${trophies.length}`)),
    el('div', { class: 'tally-side' },
      el('span', { class: 'meter meter-wide', style: `--fill:${(done / trophies.length).toFixed(3)}`, role: 'img', 'aria-label': `${Math.round(done / trophies.length * 100)}% earned` }),
      el('ul', { class: 'tally-grades' }, GRADES.map((g) => {
        const of = trophies.filter((t) => t.grade === g);
        return el('li', { class: `tg tg-${g}` }, `${g[0].toUpperCase()}${g.slice(1)} ${n(of)}/${of.length}`);
      }))));
}

function render() {
  $('shield').checked = progress.settings.spoilerShield;
  $('shield-state').textContent = progress.settings.spoilerShield ? 'on' : 'off';
  renderTally();
  if (view.tab === 'roadmap') { renderRoadmap($('view-roadmap'), trophies, progress, on); return; }
  const list = visibleTrophies(trophies, progress, view);
  renderFilters($('filters'), trophies, progress, view, on);
  for (const b of $('status-filter').querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.status === view.status));
  renderList($('rows'), list, progress, view, on);
  if (view.panel === 'check') $('detail').replaceChildren(renderDataCheck(trophies, progress, closePanel));
  else if (view.panel) $('detail').replaceChildren(view.panel);
  else renderDetail($('detail'), trophies.find((t) => t.name === view.selected), progress, STAGES, on);
  $('open-check').setAttribute('aria-pressed', String(view.panel === 'check'));
}

function showTab(tab) {
  view.tab = tab;
  for (const name of ['checklist', 'roadmap']) {
    $(`tab-${name}`).setAttribute('aria-selected', String(name === tab));
    $(`view-${name}`).hidden = name !== tab;
  }
  history.replaceState(null, '', tab === 'roadmap' ? '#roadmap' : '#');
  render();
  if (tab === 'checklist') document.querySelector('.row.is-open')?.scrollIntoView({ block: 'nearest' });
}

function showPanel(panel) {
  view.panel = panel;
  showTab('checklist');
  $('detail').scrollTop = 0;
  $('detail').querySelector('h2')?.focus?.();
}
function closePanel() { view.panel = null; render(); }

const transferCtx = {
  dialog: $('dialog'), get trophies() { return trophies; }, say, showPanel, closePanel,
  getProgress: () => progress, setProgress: (p) => { progress = p; commit(); },
};

async function boot() {
  try {
    const doc = await (await fetch('data/trophies.json')).json();
    trophies = Array.isArray(doc) ? doc : doc.trophies;
  } catch {
    $('rows').replaceChildren(el('li', { class: 'empty' }, 'The trophy list did not load. Serve the app folder over HTTP and reload.'));
    return;
  }
  view.selected = trophies.find((t) => t.grade === 'platinum')?.name ?? null;
  $('shield').addEventListener('change', (e) => { progress.settings.spoilerShield = e.target.checked; commit(); });
  $('export').addEventListener('click', () => say(downloadExport(progress)));
  $('import-file').addEventListener('change', (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) startImport(f, transferCtx); });
  $('reset').addEventListener('click', () => confirmReset(transferCtx));
  $('search').addEventListener('input', (e) => { view.query = e.target.value; render(); });
  $('status-filter').addEventListener('click', (e) => { const s = e.target.closest('button')?.dataset.status; if (s) { view.status = s; render(); } });
  $('tab-checklist').addEventListener('click', () => showTab('checklist'));
  $('tab-roadmap').addEventListener('click', () => showTab('roadmap'));
  $('open-check').addEventListener('click', () => (view.panel === 'check' ? closePanel() : showPanel('check')));
  showTab(location.hash === '#roadmap' ? 'roadmap' : 'checklist');
}

boot();
