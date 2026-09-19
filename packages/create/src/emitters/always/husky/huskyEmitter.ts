import { type Artifact, copied } from '../../../config/artifact';

// Husky and Claude Code invoke these directly, so the mode bit is part of the artifact.
export const huskyEmitter = (): Artifact[] => {
  return ['pre-commit', 'commit-msg'].map((hook) => {
    return {
      ...copied(`.husky/${hook}`, `husky/${hook}`),
      executable: true,
    };
  });
};
