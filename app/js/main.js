// Boot: load the trophy list, restore progress, wire the top bar, tabs and views, re-render on change.
import { el } from './dom.js';
import { loadProgress, saveProgress, setEarned, setCounter } from './progress.js';
import { renderFilters, renderList, renderDetail, visibleTrophies } from './checklist.js';
import { renderRoadmap, STAGES } from './roadmap.js';
import { downloadExport, startImport, confirmReset } from './transfer.js';

const $ = (id) => document.getElementById(id);
const GRADES = ['platinum', 'gold', 'silver', 'bronze'];

let progress = loadProgress();
const view = { filter: 'all', status: 'all', query: '', selected: null, tab: 'checklist' };
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
  select(name) { view.selected = name; render(); },
  count(t, v) { setCounter(progress, t, v); commit(); },
  filter(key) { view.filter = key; render(); },
  clearFilters() { Object.assign(view, { filter: 'all', status: 'all', query: '' }); $('search').value = ''; render(); },
  open(name) { view.selected = name; showTab('checklist'); },
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
  renderDetail($('detail'), trophies.find((t) => t.name === view.selected), progress, STAGES, on);
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

const transferCtx = {
  dialog: $('dialog'), get trophies() { return trophies; }, say,
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
  showTab(location.hash === '#roadmap' ? 'roadmap' : 'checklist');
}

boot();
