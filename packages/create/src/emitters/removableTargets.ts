import {
  AGENTS,
  DEFAULT_ANSWERS,
  PACKAGE_MANAGERS,
  TARGET_IDS,
  TESTING_CHOICES,
  TYPE_SAFETY_CHOICES,
} from '../answers/answers';
import { LEGACY_CONFIG_PATH } from '../answers/linteljsConfig';
import { EMPTY_PROJECT } from '../config/projectShape';

import { BUILD_EMITTERS } from './registry';

import type { Answers } from '../answers/answers';

// `always/` is what no answer gates, so nothing it writes can ever become obsolete. Every other group is named for
// an answer that can be deselected, which is exactly what makes its files removable.
const PERMANENT_GROUP = 'always/';

/**
 * One axis per answer that changes which of those files are written. Folded rather than nested: the cross product
 * is what makes this safe, since varying one answer at a time would assume they act independently, and a table of
 * axes says that in one line each rather than in five levels of loop.
 */
const AXES: ((answers: Answers) => Answers[])[] = [
  (answers) => {
    return TARGET_IDS.map((target) => {
      return {
        ...answers,
        target,
      };
    });
  },
  (answers) => {
    return PACKAGE_MANAGERS.map((packageManager) => {
      return {
        ...answers,
        packageManager,
      };
    });
  },
  (answers) => {
    return TYPE_SAFETY_CHOICES.map((typeSafety) => {
      return {
        ...answers,
        typeSafety,
      };
    });
  },
  (answers) => {
    return [['zod' as const], []].map((libraries) => {
      return {
        ...answers,
        libraries,
      };
    });
  },
  (answers) => {
    return TESTING_CHOICES.map((testing) => {
      return {
        ...answers,
        testing,
      };
    });
  },
];

// All four hosts throughout, so every agent emitter fires on every pass.
const variations = (): Answers[] => {
  return AXES.reduce((combinations, spread) => {
    return combinations.flatMap(spread);
  }, [{
    ...DEFAULT_ANSWERS,
    agents: AGENTS,
  }]);
};

/**
 * What `sync` may remove: every path an answer-gated emitter can write, so deselecting a host, switching package
 * manager or tightening the type-safety answer drops what the old answer left behind. Derived rather than listed,
 * because a list is a second place to remember a new file and the first place to forget one.
 *
 * Two kinds are held back, and both are files linteljs does not own outright:
 *
 * - Preserved. `CLAUDE.md` and `AGENTS.md` are the project's the moment it has them, so a deselected host leaves
 *   its adapter behind rather than having it deleted.
 * - Merged. `pnpm-workspace.yaml` and the tailwind style entry carry the project's own lines beside linteljs's, so
 *   removing either would take content no one else wrote a copy of.
 */
export const removableTargets = (): readonly string[] => {
  const emitters = Object.entries(BUILD_EMITTERS).filter(([key]) => {
    return !key.startsWith(PERMANENT_GROUP);
  }).map(([, emit]) => {
    return emit;
  });

  const targets = new Set<string>();

  for (const answers of variations()) {
    for (const emit of emitters) {
      for (const artifact of emit(answers, EMPTY_PROJECT, '')) {
        const owned = !('merge' in artifact.content) || artifact.removable === true;

        if (artifact.preserve !== true && owned) {
          targets.add(artifact.target);
        }
      }
    }
  }

  // Not emitted by anything, so not derivable: a file older versions wrote under a name this one no longer uses.
  targets.add(LEGACY_CONFIG_PATH);

  return [...targets];
};
