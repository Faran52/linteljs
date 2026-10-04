import { type Artifact } from '@config/types';

import { copied } from '../../utils/artifactUtils';

// What the pre-commit and commit-msg hooks run, and the logger the shipped scripts report through.
export const commitGateEmitter = (): Artifact[] => {
  const artifacts = [
    copied('lint-staged.config.js'),
    copied('commitlint.config.js'),
    copied('scripts/typecheckStaged.ts'),
    copied('scripts/utils/typecheckStagedUtils.ts'),
    copied('scripts/utils/loggerUtils.ts'),
  ];

  return artifacts;
};
