import { EMPTY_PROJECT, type ProjectShape } from './projectShape';
import { SEED_EMITTERS } from './registry';

import type { Answers } from '../answers/answers';
import type { Artifact } from './artifact';

/**
 * What a project is seeded with and owns afterwards. Kept out of `buildArtifacts` because that list is what
 * `sync` re-applies and none of this is lintel's to maintain once the project has it. Everything here still
 * reaches disk as an `Artifact`, so `applyArtifact` is the only writer either way.
 */
export const seedArtifacts = (
  answers: Answers,
  name: string,
  project: ProjectShape = EMPTY_PROJECT,
): Artifact[] => {
  return Object.values(SEED_EMITTERS).flatMap((emit) => {
    return emit(answers, project, name);
  });
};
