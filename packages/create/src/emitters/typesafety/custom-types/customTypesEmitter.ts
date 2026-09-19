import { type Artifact } from '../../../config/artifact';
import { copied } from '../../utils/artifactUtils';

import type { Answers } from '../../../answers/answers';

// The relaxed floor declares what the strict one would refuse, so only that answer receives it.
export const customTypesEmitter = (answers: Answers): Artifact[] => {
  return answers.typeSafety === 'relaxed'
    ? [copied('src/typings/customTypes.d.ts', 'typings/customTypes.d.ts')]
    : [];
};
