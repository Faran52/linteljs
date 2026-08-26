/**
 * The checker holds the standard's pattern list and the project's own `PROJECT_SKIPPED` and `PROJECT_BANNED`.
 * Preserving it froze both, emitting it would delete the project's half, so the shipped file supplies everything and
 * the project's blocks are lifted back over the empty ones.
 */

// The declaration through its closing `];`, empty on one line or with entries closing on a line of its own. Read as a
// whole line, since a reason written beside an entry quoting code (`arr[0];`) carries that pair and ended it early.
const blockOf = (source: string, name: string): string | null => {
  const opening = source.indexOf(`const ${name}`);

  if (opening === -1) {
    return null;
  }

  const rest = source.slice(opening);
  // `split` with a limit of one answers exactly one element for any string, so this is the declaration line or all
  // of what follows it, and never nothing.
  const declaration = rest.split('\n', 1).join('');

  if (declaration.includes('];')) {
    return declaration;
  }

  const closing = rest.indexOf('\n];');

  return closing === -1 ? null : rest.slice(0, closing + 3);
};

const carriedOver = (shipped: string, current: string, name: string): string => {
  const theirs = blockOf(current, name);
  const ours = blockOf(shipped, name);

  if (theirs === null || ours === null) {
    // A project that never edited its block, or a shipped file that stopped declaring one.
    return shipped;
  }

  // By function: `$&` or `$'` in a string replacement reads as the match and the text after it.
  return shipped.replace(ours, () => {
    return theirs;
  });
};

export const mergeChecker = (shipped: string, current: string | null): string => {
  if (current === null) {
    return shipped;
  }

  return carriedOver(carriedOver(shipped, current, 'PROJECT_SKIPPED'), current, 'PROJECT_BANNED');
};
