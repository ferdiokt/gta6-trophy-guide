// Export, import (validate, then Merge or Replace in the side panel) and Reset (confirm first), wired to the top bar.
import { el } from './dom.js';
import { buildExport, parseImport, applyImport, importSummary, emptyProgress } from './progress.js';

export function downloadExport(progress) {
  const file = buildExport(progress);
  const a = el('a', {
    href: URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })),
    download: `leonida-ledger-${file.exported.slice(0, 10)}.json`,
  });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 0);
  return `Exported ${file.earned.length} earned trophies.`;
}

function showDialog(dialog, title, body, actions) {
  dialog.replaceChildren(el('form', { method: 'dialog', class: 'dlg' },
    el('h2', { class: 'dlg-title' }, title), ...body,
    el('div', { class: 'dlg-actions' }, actions)));
  if (!dialog.open) dialog.showModal();
}

// The import review sits in the guide pane beside the list (not a modal), so the checklist stays readable.
function importPanel(title, body, actions) {
  return el('section', { class: 'side-panel', 'aria-labelledby': 'import-title' },
    el('header', { class: 'side-head' }, el('h2', { id: 'import-title', class: 'side-title', tabindex: -1 }, title)),
    ...body, el('div', { class: 'dlg-actions' }, actions));
}

// Reads the picked file, shows what it holds and lets the reader choose Merge or Replace.
export async function startImport(file, ctx) {
  const { trophies, getProgress, setProgress, say, showPanel, closePanel } = ctx;
  let result;
  try {
    result = parseImport(await file.text(), trophies);
  } catch (err) {
    showPanel(importPanel('Import refused', [el('p', { class: 'dlg-error', role: 'alert' }, err.message)],
      [el('button', { type: 'button', class: 'btn', onclick: closePanel }, 'Close')]));
    return;
  }
  const summary = importSummary(result);
  const apply = (mode) => {
    closePanel();
    setProgress(applyImport(getProgress(), result.progress, mode));
    say(`Imported ${summary} (${mode === 'merge' ? 'merged' : 'replaced'}).`);
  };
  showPanel(importPanel('Import progress', [
    el('p', { class: 'dlg-summary' }, summary),
    result.ignored.length ? el('p', { class: 'dlg-ignored' }, `Ignored, not on the official list: ${result.ignored.join(', ')}.`) : null,
    el('p', {}, `From ${file.name}. Merge keeps what you have and adds the file's trophies; Replace makes the file your whole progress.`),
  ], [
    el('button', { type: 'button', class: 'btn', onclick: closePanel }, 'Cancel'),
    el('button', { type: 'button', class: 'btn', onclick: () => apply('replace') }, 'Replace'),
    el('button', { type: 'button', class: 'btn btn-primary', onclick: () => apply('merge') }, 'Merge'),
  ]));
}

export function confirmReset(ctx) {
  const { dialog, getProgress, setProgress, say } = ctx;
  const n = Object.keys(getProgress().earned).length;
  showDialog(dialog, 'Reset all progress?', [
    el('p', {}, `This clears ${n} earned trophies, every counter and every revealed spoiler. Export first if you want a copy.`),
  ], [
    el('button', { class: 'btn', value: 'cancel', autofocus: true }, 'Keep my progress'),
    el('button', {
      class: 'btn btn-danger', value: 'reset',
      onclick: () => { setProgress({ ...emptyProgress(), settings: getProgress().settings }); say('Progress reset.'); },
    }, 'Reset progress'),
  ]);
}
