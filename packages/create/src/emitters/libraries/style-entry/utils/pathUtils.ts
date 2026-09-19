import { projectSpelling } from '../../../../config/projectShape';
import { targetFor } from '../../../../targets';

import type { Answers } from '../../../../answers/answers';

// The target's own where present, the project's otherwise, and the target's default at birth.
export const styleEntryPath = (answers: Answers, present: readonly string[]): string | undefined => {
  return projectSpelling(targetFor(answers).styleEntry, present);
};
