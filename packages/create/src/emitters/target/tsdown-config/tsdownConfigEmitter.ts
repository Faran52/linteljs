import { type Artifact, type Emitter } from '@config/types';

import { targetFor } from '@targets';

import { emitted } from '../../utils/artifactUtils';

import { TSDOWN_CONFIG } from './constants';

export const tsdownConfigEmitter: Emitter = (answers): Artifact[] => {
  if (targetFor(answers).libraryProject !== true) {
    return [];
  }

  const artifacts = [emitted('standard', 'tsdown.config.ts', TSDOWN_CONFIG)];

  return artifacts;
};
