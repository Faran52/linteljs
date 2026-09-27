import { allowedBuildNames } from '../../../utils/packageJsonUtils';

import type { Answers } from '@config/types';

// Two days for everything else; linteljs itself is exempt so a fresh release reaches `sync` the day it ships.
export const RELEASE_AGE_BLOCK = "minimumReleaseAge: 2880\nminimumReleaseAgeExclude:\n  - '@linteljs/*'\n";

// No `packages:` key: the file exists for `allowBuilds`, where a denied build fails with ERR_PNPM_IGNORED_BUILDS.
export const allowBuildsBlock = (answers: Answers): string => {
  const entries = allowedBuildNames(answers)
    .map((name) => {
      // `@` opens a reserved YAML indicator, so a scoped name as a bare key fails to parse.
      return `  '${name}': true`;
    })
    .join('\n');

  return `allowBuilds:\n${entries}\n`;
};
