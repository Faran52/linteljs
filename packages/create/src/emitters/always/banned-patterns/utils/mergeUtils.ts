const ARRAY_CLOSE = '\n];';

// Merged, so the shipped patterns update and the project's own blocks survive.

// Anchored to a whole line: a comment or a longer name can hold the same text. Empty where there is none.
const blockOf = (source: string, name: string): string => {
  const opening = new RegExp(`^const ${name}\\b.*$`, 'mu').exec(source);

  if (opening === null) {
    return '';
  }

  const [declaration] = opening;

  if (declaration.includes('];')) {
    return declaration;
  }

  const rest = source.slice(opening.index);
  const closing = rest.indexOf(ARRAY_CLOSE);

  return closing === -1 ? '' : rest.slice(0, closing + ARRAY_CLOSE.length);
};

const carriedOver = (shipped: string, current: string, name: string): string => {
  const theirs = blockOf(current, name);
  const ours = blockOf(shipped, name);

  if (theirs === '' || ours === '') {
    return shipped;
  }

  // By function: `$&` in a string replacement reads as the match.
  return shipped
    .replace(ours, () => {
      return theirs;
    });
};

const IMPORT_ANCHOR = '  checkBanned,\n';

export const mergeChecker = (shipped: string, current: string | null): string => {
  // With no file yet, the shipped text stands in for it and every block carries over unchanged.
  const existing = current ?? shipped;

  const withSkipped = carriedOver(shipped, existing, 'PROJECT_SKIPPED');
  const merged = carriedOver(withSkipped, existing, 'PROJECT_BANNED');
  const banned = blockOf(merged, 'PROJECT_BANNED');

  // A pre-2.0 project block calls `directive` without importing it.
  return /\bdirective\(/u.test(banned)
    ? merged.replace(IMPORT_ANCHOR, `${IMPORT_ANCHOR}  directive,\n`)
    : merged;
};
