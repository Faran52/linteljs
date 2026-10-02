import { type Artifact } from '@config/types';

import { copied } from '../../utils/artifactUtils';

// Husky and Claude Code invoke these directly, so the mode bit is part of the artifact.
export const huskyEmitter = (): Artifact[] => {
  const hooks = ['pre-commit', 'commit-msg'];

  return hooks
    .map((hook) => {
      const artifact: Artifact = {
        ...copied(`.husky/${hook}`),
        executable: true,
      };

      return artifact;
    });
};
