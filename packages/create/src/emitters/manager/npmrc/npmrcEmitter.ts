import { type Artifact } from '@config/types';

import { emitted } from '../../utils/artifactUtils';

import type { Answers } from '@answers';

// Without it npm refuses the install outright where pnpm and yarn take their own allowance; DESIGN.md measured it.
// Inline like the `.yarnrc.yml` beside it, and because `npm pack` drops a `.npmrc` at any depth.
export const npmrcEmitter = (answers: Answers): Artifact[] => {
  return answers.packageManager === 'npm' ? [emitted('standard', '.npmrc', 'legacy-peer-deps=true\n')] : [];
};
