import { targetFor } from '../../model/targets';
import { allowedBuildNames, buildDevDependencies } from '../package-json/emitPackageJson';
import { ESLINT_RANGE } from '../package-json/versions';

import type { Answers } from '../../model/answers/answers';

/**
 * No `packages:` key: the file exists for `allowBuilds` (a denied build fails with ERR_PNPM_IGNORED_BUILDS) and
 * the peer ranges.
 * Plugins whose `eslint` peer range closes before the installed major, keyed by the package that brings them.
 * Scoped with `>` so the allowance reaches only that dependent. Open ranges (`>=9.0.0`) need nothing and are absent.
 */
const PEER_RANGE_GAPS: Record<string, string[]> = {
  // Never loaded: pnpm installs `eslint-plugin-import` as an optional peer of the resolver, and the layers use
  // `import-x`.
  '@linteljs/eslint-config': ['eslint-plugin-import'],
  'eslint-plugin-jsx-a11y': ['eslint-plugin-jsx-a11y'],
  'eslint-plugin-solid': ['eslint-plugin-solid'],
};

export const allowBuildsBlock = (answers: Answers): string => {
  const entries = allowedBuildNames(answers)
    .map((name) => {
      // `@` opens a reserved YAML indicator, so a scoped name as a bare key fails to parse.
      return `  '${name}': true`;
    })
    .join('\n');

  return `allowBuilds:\n${entries}\n`;
};

// Follows `versions.ts` rather than repeating a number.
const eslintMajor = (): string => {
  return String(Number.parseInt(ESLINT_RANGE.replace(/^[\^~]/, ''), 10));
};

export const peerRangeAllowances = (answers: Answers): string[] => {
  const installed = Object.keys(buildDevDependencies(answers));

  return [...new Set(
    installed.flatMap((name) => {
      return PEER_RANGE_GAPS[name] ?? [];
    }),
  )].sort((left, right) => {
    return left.localeCompare(right, 'en');
  });
};

// Always at least one entry: every project's `@linteljs/eslint-config` brings the resolver.
export const peerRulesBlock = (answers: Answers): string => {
  const allowed = peerRangeAllowances(answers);
  const major = eslintMajor();
  const entries = [
    ...allowed.map((name) => {
      return `    '${name}>eslint': '${major}'`;
    }),
    ...Object.entries(targetFor(answers).peerAllowances ?? {}).map(([pair, version]) => {
      return `    '${pair}': '${version}'`;
    }),
  ].join('\n');

  return `\npeerDependencyRules:\n  allowedVersions:\n${entries}\n`;
};

export const emitPnpmWorkspace = (answers: Answers): string => {
  return `${allowBuildsBlock(answers)}${peerRulesBlock(answers)}`;
};
