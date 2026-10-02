import { type Answers, type Artifact } from '@config/types';

import { copied } from '../../utils/artifactUtils';

// The relaxed floor declares what the strict one would refuse, so only that answer receives it.
export const customTypesEmitter = (answers: Answers): Artifact[] => {
  const artifacts: Artifact[] = answers.typeSafety === 'relaxed'
    ? [copied('src/typings/customTypes.d.ts')]
    : [];

  return artifacts;
};
