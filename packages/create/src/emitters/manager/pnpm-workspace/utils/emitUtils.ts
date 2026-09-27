import { allowedBuildNames } from '../../../utils/packageJsonUtils';

import type { Answers } from '@config/types';

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
