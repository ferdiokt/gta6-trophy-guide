// Progress state: what is earned (with when), counters, revealed spoilers and settings.
// Pure functions except loadProgress/saveProgress, so the import rules are testable in Node.

export const STORE_KEY = 'leonida-ledger/v1';
export const FILE_FORMAT = 'leonida-ledger-progress';
export const FILE_VERSION = 1;
const MAX_IMPORT_BYTES = 1_000_000;

export function emptyProgress() {
  return { earned: {}, counters: {}, revealed: [], settings: { spoilerShield: true } };
}

export function loadProgress(storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(STORE_KEY);
    if (!raw) return emptyProgress();
    const p = JSON.parse(raw);
    const base = emptyProgress();
    return {
      earned: p.earned && typeof p.earned === 'object' ? p.earned : {},
      counters: p.counters && typeof p.counters === 'object' ? p.counters : {},
      revealed: Array.isArray(p.revealed) ? p.revealed : [],
      settings: { ...base.settings, ...(p.settings || {}) },
    };
  } catch {
    return emptyProgress(); // a corrupt store must not brick the app
  }
}

export function saveProgress(progress, storage = globalThis.localStorage) {
  storage.setItem(STORE_KEY, JSON.stringify(progress));
}

export function setEarned(progress, name, on, now = new Date()) {
  if (on) progress.earned[name] = progress.earned[name] || now.toISOString();
  else delete progress.earned[name];
}

export function setCounter(progress, trophy, value) {
  const v = Math.max(0, Math.min(trophy.count, Math.round(Number(value) || 0)));
  if (v) progress.counters[trophy.name] = v;
  else delete progress.counters[trophy.name];
  return v;
}

export function buildExport(progress, now = new Date()) {
  return {
    format: FILE_FORMAT,
    version: FILE_VERSION,
    exported: now.toISOString(),
    earned: Object.entries(progress.earned).map(([name, at]) => ({ name, at })),
    counters: { ...progress.counters },
    revealed: [...progress.revealed],
    settings: { ...progress.settings },
  };
}

// Validates an import file against the trophy list. Throws an Error with a reader-facing message
// when the file is unusable; returns the parsed progress plus the names it had to ignore.
export function parseImport(text, trophies) {
  if (text.length > MAX_IMPORT_BYTES) throw new Error('That file is over 1 MB, too big to be a progress file.');
  let doc;
  try {
    doc = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON. Pick a file this tracker exported.');
  }
  if (!doc || typeof doc !== 'object' || doc.format !== FILE_FORMAT) {
    throw new Error('That JSON is not a Leonida Ledger progress file (its "format" is missing or different).');
  }
  if (doc.version !== FILE_VERSION) throw new Error(`File version ${doc.version} is not supported; this tracker reads version ${FILE_VERSION}.`);
  if (!Array.isArray(doc.earned)) throw new Error('The file has no "earned" list.');

  const byName = new Map(trophies.map((t) => [t.name, t]));
  const ignored = new Set();
  const next = emptyProgress();
  for (const item of doc.earned) {
    const name = item && typeof item.name === 'string' ? item.name : null;
    if (!name || !byName.has(name)) { ignored.add(name ?? String(item)); continue; }
    const at = typeof item.at === 'string' && !Number.isNaN(Date.parse(item.at)) ? item.at : new Date().toISOString();
    next.earned[name] = at;
  }
  for (const [name, value] of Object.entries(doc.counters || {})) {
    const t = byName.get(name);
    if (!t || !t.count) { ignored.add(name); continue; }
    setCounter(next, t, value);
  }
  next.revealed = (Array.isArray(doc.revealed) ? doc.revealed : []).filter((n) => byName.has(n));
  if (doc.settings && typeof doc.settings.spoilerShield === 'boolean') next.settings.spoilerShield = doc.settings.spoilerShield;
  return { progress: next, ignored: [...ignored] };
}

// Merge keeps the earliest earned time and the higher counter; Replace takes the file as it is.
export function applyImport(current, incoming, mode) {
  if (mode === 'replace') return structuredClone(incoming);
  const out = structuredClone(current);
  for (const [name, at] of Object.entries(incoming.earned)) {
    out.earned[name] = out.earned[name] && out.earned[name] < at ? out.earned[name] : at;
  }
  for (const [name, v] of Object.entries(incoming.counters)) out.counters[name] = Math.max(out.counters[name] || 0, v);
  out.revealed = [...new Set([...out.revealed, ...incoming.revealed])];
  return out;
}

export function importSummary(result) {
  return `${Object.keys(result.progress.earned).length} earned, ${result.ignored.length} ignored`;
}
