// The spoiler shield: while it is on, an unearned story trophy, or one PlayStation hides, shows only
// "Hidden trophy", its grade and kind, until the reader reveals it or marks it earned.
export function isShielded(trophy, progress) {
  if (!progress.settings.spoilerShield) return false;
  if (progress.earned[trophy.name] || progress.revealed.includes(trophy.name)) return false;
  return trophy.kind === 'story' || trophy.hidden === true;
}

// What search may match: a shielded trophy is found only by its grade and kind, never its name.
export function searchableText(trophy, progress) {
  const open = !isShielded(trophy, progress);
  return [open && trophy.name, open && trophy.description, open && trophy.guide, trophy.grade, trophy.kind, !open && 'hidden trophy']
    .filter(Boolean).join(' ').toLowerCase();
}
