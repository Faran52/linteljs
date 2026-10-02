import { type Artifact } from '@config/types';

import { copied } from '../../utils/artifactUtils';

export const lintStagedEmitter = (): Artifact[] => {
  const artifacts = [copied('lint-staged.config.js')];

  return artifacts;
};
