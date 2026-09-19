import { type Artifact } from '../../../config/artifact';
import { copied } from '../../utils/artifactUtils';

import type { Answers } from '../../../answers/answers';

export const npmrcEmitter = (answers: Answers): Artifact[] => {
  return answers.packageManager === 'npm' ? [copied('.npmrc', 'npm/npmrc')] : [];
};
