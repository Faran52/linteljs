import { targetFor } from '#targets';

import { allowedBuildNames } from '../../../always/package-json/packageJsonEmitter';

import type { Answers } from '#answers';

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
 * What a project is allowed to install against a peer range that refuses it, which is the target's own business and
 * nothing else's now. The table that used to sit here keyed allowances by the plugin that dragged a stale peer in,
 * and every one of its entries died: the layers take `import-x` and `jsx-a11y-x`, `eslint-plugin-solid` admits
 * eslint 10, and `eslint-plugin-astro` 3.2 peers the fork itself. Measured rather than assumed, against both
 * lockfiles: neither plugin it named is installed anywhere. Two allowances are left and both are a target's,
 * `@angular/build` peering vitest 4 against the 5 a project installs, and React Native's cli plugin pinning a metro
 * config to the patch. A new one goes on the target record beside those.
 *
 * Nothing to allow is now the common case, and pnpm rejects a `peerDependencyRules` key with an empty map under it.
 */
export const peerRulesBlock = (answers: Answers): string => {
  const entries = Object.entries(targetFor(answers).peerAllowances ?? {}).map(([pair, version]) => {
    return `    '${pair}': '${version}'`;
  });

  return entries.length === 0 ? '' : `\npeerDependencyRules:\n  allowedVersions:\n${entries.join('\n')}\n`;
};

export const emitPnpmWorkspace = (answers: Answers): string => {
  return `${allowBuildsBlock(answers)}${peerRulesBlock(answers)}`;
};
