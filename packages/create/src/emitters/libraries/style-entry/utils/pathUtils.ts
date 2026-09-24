import { targetFor } from '@targets';

import { projectSpelling } from '../../../utils/shapeUtils';

import type { Answers } from '@answers';

// The target's own where present, the project's otherwise, and the target's default at birth.
export const styleEntryPath = (answers: Answers, present: readonly string[]): string => {
  return projectSpelling(targetFor(answers).styleEntry, present);
};
