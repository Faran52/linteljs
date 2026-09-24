import { type Artifact } from '#config/types';

import { copied } from '../../utils/artifactUtils';

export const loggerUtilsEmitter = (): Artifact[] => {
  return [copied('scripts/utils/loggerUtils.ts')];
};
