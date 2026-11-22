import { uniq } from 'es-toolkit';

import { MANAGER_FLOORS } from '@config/constants';
import {
  type Answers,
  type Artifact,
  type Workspace,
} from '@config/types';

import { rankOf } from '@utils/versionUtils';

import { emitted } from '../../utils/artifactUtils';
import { buildDependencies, buildDevDependencies } from '../../utils/packageJsonUtils';

import {
  AGE_GATE,
  AGE_GATE_FLOOR,
  HEAD,
  PEER_EXTENSIONS,
} from './constants';

const installedBy = (answers: Answers): string[] => {
  const dependencies = buildDependencies(answers);
  const devDependencies = buildDevDependencies(answers);

  const names = [...Object.keys(dependencies), ...Object.keys(devDependencies)];

  return names;
};

// One file at the root serves every project, so it carries each project's extensions.
export const emitYarnrc = (first: Answers, ...rest: Answers[]): string => {
  const installed = [first, ...rest].flatMap(installedBy);
  // No extension looks up `undefined`, which `join` writes as nothing.
  const peerExtensions = installed
    .map((name) => {
      return PEER_EXTENSIONS[name];
    });

  const blocks = uniq(peerExtensions).join('');
  const version = first.packageManagerVersion ?? MANAGER_FLOORS.yarn;
  const ageGate = rankOf(version) >= rankOf(AGE_GATE_FLOOR) ? AGE_GATE : '';

  // Never empty: every target installs `@commitlint/cli`.
  return `${HEAD}${ageGate}packageExtensions:\n${blocks}`;
};

export const yarnrcEmitter = (workspace: Workspace): Artifact[] => {
  const [first, ...rest] = workspace.projects;

  if (first.answers.packageManager !== 'yarn') {
    return [];
  }

  const others = rest
    .map(({ answers }) => {
      return answers;
    });
  const yarnrc = emitYarnrc(first.answers, ...others);
  const artifacts = [emitted('package', '.yarnrc.yml', yarnrc)];

  return artifacts;
};
