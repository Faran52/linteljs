// Preserving the checker froze the pattern list, emitting it deleted the project's blocks; so the shipped file
// supplies everything and the project's `PROJECT_SKIPPED` and `PROJECT_BANNED` are lifted back over it.

// The declaration through its closing `];`, read as whole lines since a reason quoting `arr[0];` ended it early.
const blockOf = (source: string, name: string): string | null => {
  const opening = source.indexOf(`const ${name}`);

  if (opening === -1) {
    return null;
  }

  const rest = source.slice(opening);
  // `split` with a limit of one answers exactly one element for any string.
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
    // Never edited, or no longer declared.
    return shipped;
  }

  // By function: `$&` in a string replacement reads as the match.
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
