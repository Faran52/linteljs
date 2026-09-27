import { targetFor } from '@targets';

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

/**
 * What a project is allowed to install against a peer range that refuses it, which is the target's own business:
 * `@angular/build` peering vitest 4 against the 5 a project installs. A new one goes on the target record beside it.
 *
 * Nothing to allow is the common case, and pnpm rejects a `peerDependencyRules` key with an empty map under it.
 */
export const peerRulesBlock = (answers: Answers): string => {
  const entries = Object.entries(targetFor(answers).peerAllowances ?? {})
    .map(([pair, version]) => {
      return `    '${pair}': '${version}'`;
    });

  return entries.length === 0 ? '' : `\npeerDependencyRules:\n  allowedVersions:\n${entries.join('\n')}\n`;
};

export const emitPnpmWorkspace = (answers: Answers): string => {
  return `${allowBuildsBlock(answers)}${peerRulesBlock(answers)}`;
};
