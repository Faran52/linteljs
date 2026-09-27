import { type Answers, type Artifact } from '@config/types';

import { emitted } from '../../utils/artifactUtils';

// Without it npm refuses the install outright where pnpm and yarn take their own allowance; docs/DESIGN.md measured it.
// Inline like the `.yarnrc.yml` beside it, and because `npm pack` drops a `.npmrc` at any depth.
export const npmrcEmitter = (answers: Answers): Artifact[] => {
  return answers.packageManager === 'npm' ? [emitted('standard', '.npmrc', 'legacy-peer-deps=true\n')] : [];
};
