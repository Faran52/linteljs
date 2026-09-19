import { hasLibrary, hasTests } from '../../../answers/answers';
import { type Artifact } from '../../../config/types';
import { targetFor } from '../../../targets';
import { copied } from '../../utils/artifactUtils';

import type { Answers } from '../../../answers/answers';

// Source no scaffolder wrote, and the tests that cover it. Birth only: a project owns its own source from its
// first run. The tests come after the files, since one of them is what a starter test covers.
export const starterSourceEmitter = (answers: Answers): Artifact[] => {
  const target = targetFor(answers);
  const artifacts: Artifact[] = [];

  // Never a test helper the testing answer declined: a test artifact is what `testing: none` is declining.
  for (const file of target.starterFiles ?? []) {
    if ((file.library === undefined || hasLibrary(answers, file.library))
      && (file.router === undefined || answers.router === file.router)
      && (file.tests === undefined || hasTests(answers))) {
      artifacts.push({
        ...copied(file.target, file.source),
        fresh: true,
      });
    }
  }

  // After the starter files, since one of them is what a starter test covers.
  if (hasTests(answers)) {
    for (const test of target.starterTests ?? []) {
      artifacts.push({
        ...copied(test.target, test.source),
        fresh: true,
        requires: test.covers,
      });
    }
  }

  return artifacts;
};
