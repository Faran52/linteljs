import { type Artifact } from '@config/types';

import { copied } from '../../utils/artifactUtils';

export const typecheckStagedEmitter = (): Artifact[] => {
  const artifacts = [copied('scripts/typecheckStaged.ts')];

  return artifacts;
};
