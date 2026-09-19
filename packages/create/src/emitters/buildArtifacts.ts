import { EMPTY_PROJECT, type ProjectShape } from '../config/projectShape';

import { BUILD_EMITTERS } from './registry';

import type { Answers } from '../answers/answers';
import type { Artifact } from '../config/artifact';

/**
 * Every file this CLI owns some or all of, which both `create` and `sync` write from. A merge belongs here, not in
 * a stage: the `peerDependencyRules` allowance of 1.2.0 reached new projects and no old one while it was
 * stage-only. One line per emitter and no branch: whether a file is written is the emitter's own question.
 */
export const buildArtifacts = (
  answers: Answers,
  project: ProjectShape = EMPTY_PROJECT,
  name = '',
): Artifact[] => {
  return Object.values(BUILD_EMITTERS).flatMap((emit) => {
    return emit(answers, project, name);
  });
};
