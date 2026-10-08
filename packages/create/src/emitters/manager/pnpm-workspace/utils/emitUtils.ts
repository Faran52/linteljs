import { uniq } from 'es-toolkit';

import { allowedBuildNames } from '../../../utils/packageJsonUtils';

import type { Answers } from '@config/types';

// linteljs is exempt so a fresh release installs the day it ships.
export const RELEASE_AGE_BLOCK = "minimumReleaseAge: 2880\nminimumReleaseAgeExclude:\n  - '@linteljs/*'\n";

// No `packages:` key: the file exists for `allowBuilds`. A workspace allows what any of its projects needs.
export const allowBuildsBlock = (projects: readonly Answers[]): string => {
  const allowed = projects.flatMap(allowedBuildNames);
  const names = uniq(allowed)
    .toSorted((left, right) => {
      return left.localeCompare(right, 'en');
    });
  const entries = names
    .map((name) => {
      // `@` opens a reserved YAML indicator, so a scoped name as a bare key fails to parse.
      return `  '${name}': true`;
    })
    .join('\n');

  return `allowBuilds:\n${entries}\n`;
};

export const overridesBlock = (overrides: Record<string, string>): string => {
  const entries = Object.entries(overrides)
    .map(([name, version]) => {
      return `  '${name}': '${version}'`;
    })
    .join('\n');

  return `overrides:\n${entries}\n`;
};
