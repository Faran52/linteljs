// What every package's `stryker.config.mjs` shares: the runner, the reports, and the part `STRYKER_PART` picks.

export const STRYKER_BASE = {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  // pnpm's strict layout keeps the runner out of Stryker's own node_modules, so scanning misses it.
  plugins: ['@stryker-mutator/vitest-runner'],
  reporters: [
    'html',
    'json',
    'clear-text',
    'progress',
  ],
  incremental: true,
};

const chosenPart = (partNames) => {
  const part = process.env.STRYKER_PART;

  if (part && !partNames.includes(part)) {
    throw new Error(`STRYKER_PART "${part}" is not one of ${partNames.join(', ')}.`);
  }

  return part;
};

const excludedBefore = (parts, partNames, part) => {
  const earlierNames = partNames.slice(0, part ? partNames.indexOf(part) : 0);

  return earlierNames
    .flatMap((name) => {
      return parts[name]
        .map((glob) => {
          return `!${glob}`;
        });
    });
};

// CI splits a run into parallel jobs by `STRYKER_PART`. A file goes to the first part matching it, so each part
// excludes every earlier one. With no part set, a run mutates `all`.
export const strykerPart = (parts, all) => {
  const partNames = Object.keys(parts);
  const part = chosenPart(partNames);
  const incrementalSuffix = part ? `-${part}` : '';

  const resolved = {
    globs: part ? parts[part] : all,
    excluded: excludedBefore(parts, partNames, part),
    incrementalFile: `node_modules/.cache/stryker-incremental${incrementalSuffix}.json`,
  };

  return resolved;
};
