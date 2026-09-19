import { type Artifact, copied } from '../../../config/artifact';

import type { Answers } from '../../../answers/answers';

export const npmrcEmitter = (answers: Answers): Artifact[] => {
  return answers.packageManager === 'npm' ? [copied('.npmrc', 'npm/npmrc')] : [];
};
