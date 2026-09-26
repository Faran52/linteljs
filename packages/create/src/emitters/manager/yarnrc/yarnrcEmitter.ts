import { type Artifact } from '@config/types';

import { targetFor } from '@targets';

import { buildDependencies, buildDevDependencies } from '../../always/package-json/packageJsonEmitter';
import { emitted } from '../../utils/artifactUtils';

import { HEAD, PEER_EXTENSIONS } from './constants';

import type { Answers } from '@answers';

const logFiltersBlock = (codes: string[]): string => {
  // yarn rejects a bare `logFilters:` key outright: an empty list has to omit it.
  if (codes.length === 0) {
    return '';
  }

  return `logFilters:\n${codes.map((code) => {
    return `  - code: "${code}"\n    level: "discard"\n`;
  }).join('')}`;
};

export const emitYarnrc = (answers: Answers): string => {
  const target = targetFor(answers);
  const installed = [...Object.keys(buildDependencies(answers)), ...Object.keys(buildDevDependencies(answers))];
  // A package with no extension looks up `undefined`, which `join` writes as nothing.
  const blocks = [...new Set(installed.map((name) => {
    return PEER_EXTENSIONS[name];
  }))].join('');

  /**
   * A target naming `peerAllowances` knowingly exceeds a peer's range, and yarn can express no per-package allowance:
   * `packageExtensions` adds a range, it cannot widen one, and adding the one already there reports YN0069. Yarn
   * reports the clash as YN0060 with a YN0086 summary, so both go, and a new peer problem there is silent too.
   */
  const codes = Object.keys(target.peerAllowances ?? {}).length > 0
    ? ['YN0086', 'YN0060']
    : [];

  // Never empty: every target installs `@commitlint/cli`.
  return `${HEAD}${logFiltersBlock(codes)}packageExtensions:\n${blocks}`;
};

export const yarnrcEmitter = (answers: Answers): Artifact[] => {
  return answers.packageManager === 'yarn'
    ? [emitted('package', '.yarnrc.yml', emitYarnrc(answers))]
    : [];
};
