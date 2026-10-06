// linteljs writes no marker of its own; these are the ones code generators put on a first line.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { type EditInput } from './hostUtils.ts';

const MARKER = /@generated|\bdo not edit\b|\bauto-?generated\b|\bautomatically generated\b|\bcode generated\b/iu;

// Long enough to quote the generator a first line names, short enough for one line of a reason.
const QUOTED_LENGTH = 120;

const firstLineOf = (path: string): string | undefined => {
  try {
    const [first = ''] = readFileSync(path, 'utf8').split(/\r?\n/u, 1);
    return first;
  }
  catch {
    // A file that does not exist yet is not generated.
  }

  return undefined;
};

export const generatedFileReason = (edit: EditInput): string | undefined => {
  for (const path of edit.paths) {
    const first = firstLineOf(resolve(edit.cwd, path));

    if (first !== undefined && MARKER.test(first)) {
      return `\`${path}\` is generated, as its first line says: \`${first
        .trim()
        .slice(0, QUOTED_LENGTH)}\`. `
        + 'Change what it is generated from and run that generator again; an edit here is lost on its next run.';
    }
  }

  return undefined;
};
