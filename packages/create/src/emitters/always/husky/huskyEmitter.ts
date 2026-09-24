import { type Artifact } from '@config/types';

import { copied } from '../../utils/artifactUtils';

// Husky and Claude Code invoke these directly, so the mode bit is part of the artifact.
export const huskyEmitter = (): Artifact[] => {
  return ['pre-commit', 'commit-msg'].map((hook) => {
    return {
      ...copied(`.husky/${hook}`),
      executable: true,
    };
  });
};
