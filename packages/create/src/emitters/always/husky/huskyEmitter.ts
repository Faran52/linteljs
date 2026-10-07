import { type Answers, type Artifact } from '@config/types';

import { copied } from '../../utils/artifactUtils';

// Husky and Claude Code invoke these directly, so the mode bit is part of the artifact.
// One `--config` is lint-staged's single-config mode, which runs every task from the root: a monorepo omits it.
const withoutConfig = (source: string): string => {
  return source.replace(' --config lint-staged.config.js', '');
};

export const huskyEmitter = (answers: Answers): Artifact[] => {
  const hooks = ['pre-commit', 'commit-msg'];

  return hooks
    .map((hook) => {
      const hookFile = copied(`.husky/${hook}`);
      const artifact: Artifact = {
        ...hookFile,
        ...answers.layout === 'monorepo' ? { content: { ...hookFile.content, transform: withoutConfig } } : {},
        executable: true,
      };

      return artifact;
    });
};
