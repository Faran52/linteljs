import { type Answers, type Artifact } from '@config/types';

import { emitted } from '../../utils/artifactUtils';

// Without it npm refuses the install outright; docs/DESIGN.md measured it. Inline: `npm pack` drops a `.npmrc`.
export const npmrcEmitter = (answers: Answers): Artifact[] => {
  return answers.packageManager === 'npm' ? [emitted('standard', '.npmrc', 'legacy-peer-deps=true\n')] : [];
};
