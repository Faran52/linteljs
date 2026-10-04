import { hasTests } from '@utils/answerUtils';

import { targetFor } from '@targets';

import type { Answers, TestRunner } from '@config/types';

// Absent where the project declined a suite.
export const testRunnerOf = (answers: Answers): TestRunner | undefined => {
  if (!hasTests(answers)) {
    return undefined;
  }

  return targetFor(answers).testRunner ?? 'vitest';
};
