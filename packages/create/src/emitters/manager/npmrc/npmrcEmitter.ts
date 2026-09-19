import { type Artifact } from '../../../config/types';
import { copied } from '../../utils/artifactUtils';

import type { Answers } from '../../../answers';

export const npmrcEmitter = (answers: Answers): Artifact[] => {
  return answers.packageManager === 'npm' ? [copied('.npmrc', 'manager/npmrc/npmrc')] : [];
};
