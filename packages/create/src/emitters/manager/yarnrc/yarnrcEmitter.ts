import { MANAGER_FLOORS } from '@config/constants';
import { type Answers, type Artifact } from '@config/types';

import { rankOf } from '@utils/versionUtils';

import { emitted } from '../../utils/artifactUtils';
import { buildDependencies, buildDevDependencies } from '../../utils/packageJsonUtils';

import {
  AGE_GATE,
  AGE_GATE_FLOOR,
  HEAD,
  PEER_EXTENSIONS,
} from './constants';

export const emitYarnrc = (answers: Answers): string => {
  const dependencies = buildDependencies(answers);
  const devDependencies = buildDevDependencies(answers);
  const installed = [...Object.keys(dependencies), ...Object.keys(devDependencies)];
  // No extension looks up `undefined`, which `join` writes as nothing.
  const peerExtensions = installed
    .map((name) => {
      return PEER_EXTENSIONS[name];
    });

  const blocks = [...new Set(peerExtensions)].join('');
  const version = answers.packageManagerVersion ?? MANAGER_FLOORS.yarn;
  const ageGate = rankOf(version) >= rankOf(AGE_GATE_FLOOR) ? AGE_GATE : '';

  // Never empty: every target installs `@commitlint/cli`.
  return `${HEAD}${ageGate}packageExtensions:\n${blocks}`;
};

export const yarnrcEmitter = (answers: Answers): Artifact[] => {
  if (answers.packageManager !== 'yarn') {
    return [];
  }

  const yarnrc = emitYarnrc(answers);
  const artifacts = [emitted('package', '.yarnrc.yml', yarnrc)];

  return artifacts;
};
