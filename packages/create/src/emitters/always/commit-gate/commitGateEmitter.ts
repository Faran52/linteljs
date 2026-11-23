import { type Answers, type Artifact } from '@config/types';

import { copied } from '../../utils/artifactUtils';

// What the pre-commit and commit-msg hooks run, and the logger the shipped scripts report through.
const commitGateOf = (monorepo: boolean): Artifact[] => {
  const lintStaged = copied('lint-staged.config.js');
  // A monorepo's app runs the scripts at the git root.
  const appLintStaged: Artifact = {
    ...lintStaged,
    content: {
      ...lintStaged.content,
      transform: (source) => {
        return source.replaceAll('node scripts/', 'node ../../scripts/');
      },
    },
  };

  const artifacts = [
    monorepo ? appLintStaged : lintStaged,
    copied('commitlint.config.js'),
    copied('scripts/typecheckStaged.ts'),
    copied('scripts/utils/typecheckStagedUtils.ts'),
    copied('scripts/utils/loggerUtils.ts'),
  ];

  return artifacts;
};

export const commitGateEmitter = (answers: Answers): Artifact[] => {
  return commitGateOf(answers.layout === 'monorepo');
};
