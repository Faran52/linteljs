import { type Artifact } from '@config/types';

import {
  type Answers,
  hasLibrary,
  hasTests,
  type TargetId,
} from '@answers';
import { targetFor } from '@targets';

import { joined } from '../../utils/artifactUtils';

import type { StarterFile, StarterTest } from '@targets';

/**
 * The asset sits at the path it lands on, under this target's tree and below the answer that gates it. One string
 * rather than two that can disagree: the extension's two spellings of a background entry differ only by the browser
 * directory above them, and a file no answer gates has nothing between the target and its own path.
 */
const sourceOf = (id: TargetId, file: StarterFile | StarterTest): string => {
  const gate = ('router' in file ? file.router : undefined)
    ?? ('library' in file ? file.library : undefined)
    ?? file.variant;

  return ['starter-source', id, gate, file.target].filter(Boolean).join('/');
};

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
        ...joined(file.target, [sourceOf(target.id, file)]),
        fresh: true,
      });
    }
  }

  // After the starter files, since one of them is what a starter test covers.
  if (hasTests(answers)) {
    for (const test of target.starterTests ?? []) {
      artifacts.push({
        ...joined(test.target, [sourceOf(target.id, test)]),
        fresh: true,
        requires: [test.covers, ...test.needs ?? []],
      });
    }
  }

  return artifacts;
};
