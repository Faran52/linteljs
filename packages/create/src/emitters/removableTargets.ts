import {
  AGENTS,
  DEFAULT_ANSWERS,
  TARGET_IDS,
  TESTING_CHOICES,
} from '../answers/answers';

import { EMPTY_PROJECT } from './projectShape';
import { BUILD_EMITTERS } from './registry';

import type { Answers } from '../answers/answers';

// The group is named for the answer that decides its emitters, so membership is read off the registry key.
const AGENT_GROUP = 'agents/';

// Every answer that changes which agent files are written, with all four hosts selected so every emitter fires.
// The target decides which state rule a project is given, zod and the testing answer each add one of their own.
const variations = (): Answers[] => {
  return TARGET_IDS.flatMap((target) => {
    return [true, false].flatMap((zod) => {
      return TESTING_CHOICES.map((testing) => {
        return {
          ...DEFAULT_ANSWERS,
          target,
          agents: AGENTS,
          libraries: zod ? ['zod' as const] : [],
          testing,
        } satisfies Answers;
      });
    });
  });
};

/**
 * What `sync` may remove: every path an agent emitter can write under any answer, so deselecting a host drops the
 * files it left behind and reaches nothing the project put beside them. Derived rather than listed, because a list
 * is a second place to remember a new rule file.
 *
 * Preserved artifacts are absent on purpose. `CLAUDE.md` and `AGENTS.md` are the project's the moment it has them,
 * so a deselected host leaves its adapter behind rather than having it deleted.
 */
export const removableTargets = (): readonly string[] => {
  const emitters = Object.entries(BUILD_EMITTERS).filter(([key]) => {
    return key.startsWith(AGENT_GROUP);
  }).map(([, emit]) => {
    return emit;
  });

  const targets = new Set<string>();

  for (const answers of variations()) {
    for (const emit of emitters) {
      for (const artifact of emit(answers, EMPTY_PROJECT, '')) {
        if (artifact.preserve !== true) {
          targets.add(artifact.target);
        }
      }
    }
  }

  return [...targets];
};
