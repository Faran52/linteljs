import { EXEC_PREFIX } from '@config/constants';
import {
  type Answers,
  type Artifact,
  type PackageManager,
} from '@config/types';

import { copied } from '../../utils/artifactUtils';

// npm refuses `npx` where `devEngines` names another manager, so each hook runs through the project's own.
// One `--config` is lint-staged's single-config mode, which runs every task from the root: a monorepo omits it.
const hookText = (packageManager: PackageManager, monorepo: boolean) => {
  return (source: string): string => {
    const exec = source.replaceAll('npx ', `${EXEC_PREFIX[packageManager]} `);

    return monorepo ? exec.replace(' --config lint-staged.config.js', '') : exec;
  };
};

// Husky and Claude Code invoke these directly, so the mode bit is part of the artifact.
const huskyHooksOf = (packageManager: PackageManager, monorepo: boolean): Artifact[] => {
  const hooks = ['pre-commit', 'commit-msg'];

  return hooks
    .map((hook) => {
      const hookFile = copied(`.husky/${hook}`);
      const artifact: Artifact = {
        ...hookFile,
        content: {
          ...hookFile.content,
          transform: hookText(packageManager, monorepo),
        },
        executable: true,
      };

      return artifact;
    });
};

export const huskyEmitter = (answers: Answers): Artifact[] => {
  return huskyHooksOf(answers.packageManager, answers.layout === 'monorepo');
};
