// Merged, so the shipped patterns update and the project's own blocks survive.

// Anchored to a whole line: a comment or a longer name can hold the same text.
const blockOf = (source: string, name: string): string | null => {
  const opening = new RegExp(`^const ${name}\\b.*$`, 'mu').exec(source);

  if (opening === null) {
    return null;
  }

  const [declaration] = opening;

  if (declaration.includes('];')) {
    return declaration;
  }

  const rest = source.slice(opening.index);
  const closing = rest.indexOf('\n];');

  return closing === -1 ? null : rest.slice(0, closing + 3);
};

const carriedOver = (shipped: string, current: string, name: string): string => {
  const theirs = blockOf(current, name);
  const ours = blockOf(shipped, name);

  if (theirs === null || ours === null) {
    return shipped;
  }

  // By function: `$&` in a string replacement reads as the match.
  return shipped
    .replace(ours, () => {
      return theirs;
    });
};

export const mergeChecker = (shipped: string, current: string | null): string => {
  // With no file yet, the shipped text stands in for it and every block carries over unchanged.
  const existing = current ?? shipped;

  const withSkipped = carriedOver(shipped, existing, 'PROJECT_SKIPPED');

  return carriedOver(withSkipped, existing, 'PROJECT_BANNED');
};
