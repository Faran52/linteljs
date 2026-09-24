import {
  type Answers,
  hasTests,
  type TargetId,
} from '#answers';
import { type Artifact } from '#config/types';
import { targetFor } from '#targets';

import { joined } from '../../utils/artifactUtils';

import type { StarterFile, StarterTest } from '#targets';

// A file or a suite is written where its own `when` holds; absent is always.
const applies = (file: StarterFile | StarterTest, answers: Answers): boolean => {
  return file.when === undefined || file.when(answers);
};

/**
 * The asset sits at the path it lands on, under this target's tree and below its variant where it has one. One
 * string rather than two that can disagree: the extension's two spellings of a background entry differ only by the
 * browser directory above them, and a file with one spelling has nothing between the target and its own path.
 *
 * A file with nothing framework-specific in it sits under `shared/` instead, and every target takes the same bytes;
 * one two targets share a framework over names that target's tree and takes its copy.
 */
const rootOf = (id: TargetId, shared: true | TargetId | undefined): string => {
  if (shared === undefined) {
    return id;
  }

  return shared === true ? 'shared' : shared;
};

// `source` where the asset is named differently from what it lands as, which is the naming rules disagreeing.
const sourceOf = (id: TargetId, file: StarterFile | StarterTest): string => {
  const asset = file.source ?? file.target;

  return ['starter-source', rootOf(id, file.shared), file.variant, asset].filter(Boolean).join('/');
};

// Source no scaffolder wrote, and the tests that cover it. Birth only: a project owns its own source from its
// first run. The tests come after the files, since one of them is what a starter test covers.
export const starterSourceEmitter = (answers: Answers): Artifact[] => {
  const target = targetFor(answers);
  const artifacts: Artifact[] = [];

  /*
   * At most one spelling of a destination, and the record is read in order, so a variant is written where it
   * applies and the base where none does. Two that both apply is a record defect rather than a last-one-wins
   * race, and it fails here rather than leaving whichever the loop reached second on disk.
   *
   * Never a test helper the testing answer declined: a test artifact is what `testing: none` is declining.
   */
  const written = new Set<string>();

  for (const file of target.starterFiles) {
    if (!applies(file, answers)) {
      continue;
    }

    /*
     * Unreachable while every record is correct, which is the point of it: a variant and the base it varies from
     * are mutually exclusive by their own `when`, so two reaching here at once is a record that forgot to exclude
     * one. `registry.test.ts` walks every answer set a target reaches and would fail here rather than leave
     * whichever the loop met second on disk.
     */
    /* v8 ignore next 3 */
    if (written.has(file.target)) {
      throw new Error(`${target.id} has two starter files for ${file.target} under one answer set`);
    }

    written.add(file.target);
    artifacts.push({
      ...joined(file.target, [sourceOf(target.id, file)]),
      seed: true,
    });
  }

  // After the starter files, since one of them is what a starter test covers.
  if (hasTests(answers)) {
    for (const test of target.starterTests) {
      if (!applies(test, answers)) {
        continue;
      }

      // The same guard, for the same reason: a suite and the variant it varies from exclude each other by `when`.
      /* v8 ignore next 3 */
      if (written.has(test.target)) {
        throw new Error(`${target.id} has two starter files for ${test.target} under one answer set`);
      }

      written.add(test.target);
      artifacts.push({
        ...joined(test.target, [sourceOf(target.id, test)]),
        seed: true,
        requires: [test.covers, ...test.needs ?? []],
      });
    }
  }

  return artifacts;
};
