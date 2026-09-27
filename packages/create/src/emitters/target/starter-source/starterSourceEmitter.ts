import {
  type Answers,
  type Artifact,
  type TargetId,
} from '@config/types';

import { hasTests } from '@utils/answerUtils';

import {
  type StarterFile,
  type StarterTest,
  targetFor,
} from '@targets';

import { joined } from '../../utils/artifactUtils';

const applies = (file: StarterFile | StarterTest, answers: Answers): boolean => {
  return file.when === undefined || file.when(answers);
};

const rootOf = (id: TargetId, shared: true | TargetId | undefined): string => {
  if (shared === undefined) {
    return id;
  }

  return shared === true ? 'shared' : shared;
};

const sourceOf = (id: TargetId, file: StarterFile | StarterTest): string => {
  const asset = file.source ?? file.target;

  return ['starter-source', rootOf(id, file.shared), file.variant, asset]
    .filter(Boolean)
    .join('/');
};

// Birth only: a project owns its own source from its first run.
export const starterSourceEmitter = (answers: Answers): Artifact[] => {
  const target = targetFor(answers);
  const artifacts: Artifact[] = [];

  // A variant and its base exclude each other by their own `when`, held by `registry.test.ts`.
  for (const file of target.starterFiles) {
    if (!applies(file, answers)) {
      continue;
    }

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

      artifacts.push({
        ...joined(test.target, [sourceOf(target.id, test)]),
        seed: true,
        requires: [test.covers],
      });
    }
  }

  return artifacts;
};
