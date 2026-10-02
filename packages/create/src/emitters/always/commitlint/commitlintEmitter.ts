import { type Artifact } from '@config/types';

import { copied } from '../../utils/artifactUtils';

export const commitlintEmitter = (): Artifact[] => {
  const artifacts = [copied('commitlint.config.js')];

  return artifacts;
};
