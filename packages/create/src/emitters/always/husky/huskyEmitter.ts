import { EXEC_PREFIX } from '@config/constants';
import { type Answers, type Artifact } from '@config/types';

import { copied } from '../../utils/artifactUtils';

// npm refuses `npx` where `devEngines` names another manager, so each hook runs through the project's own.
// One `--config` is lint-staged's single-config mode, which runs every task from the root: a monorepo omits it.
const hookText = (answers: Answers) => {
  return (source: string): string => {
    const exec = source.replaceAll('npx ', `${EXEC_PREFIX[answers.packageManager]} `);

    return answers.layout === 'monorepo' ? exec.replace(' --config lint-staged.config.js', '') : exec;
  };
};

// Husky and Claude Code invoke these directly, so the mode bit is part of the artifact.
export const huskyEmitter = (answers: Answers): Artifact[] => {
  const hooks = ['pre-commit', 'commit-msg'];

  return hooks
    .map((hook) => {
      const hookFile = copied(`.husky/${hook}`);
      const artifact: Artifact = {
        ...hookFile,
        content: {
          ...hookFile.content,
          transform: hookText(answers),
        },
        executable: true,
      };

      return artifact;
    });
};
