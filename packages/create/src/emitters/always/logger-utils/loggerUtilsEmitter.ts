import { type Artifact } from '@config/types';

import { copied } from '../../utils/artifactUtils';

export const loggerUtilsEmitter = (): Artifact[] => {
  const artifacts = [copied('scripts/utils/loggerUtils.ts')];

  return artifacts;
};
