import { type Answers, type Artifact } from '@config/types';

import { emitted } from '../../utils/artifactUtils';
import { buildDependencies, buildDevDependencies } from '../../utils/packageJsonUtils';

import { HEAD, PEER_EXTENSIONS } from './constants';

export const emitYarnrc = (answers: Answers): string => {
  const installed = [...Object.keys(buildDependencies(answers)), ...Object.keys(buildDevDependencies(answers))];
  // No extension looks up `undefined`, which `join` writes as nothing.
  const peerExtensions = installed
    .map((name) => {
      return PEER_EXTENSIONS[name];
    });

  const blocks = [...new Set(peerExtensions)].join('');

  // Never empty: every target installs `@commitlint/cli`.
  return `${HEAD}packageExtensions:\n${blocks}`;
};

export const yarnrcEmitter = (answers: Answers): Artifact[] => {
  return answers.packageManager === 'yarn'
    ? [emitted('package', '.yarnrc.yml', emitYarnrc(answers))]
    : [];
};
