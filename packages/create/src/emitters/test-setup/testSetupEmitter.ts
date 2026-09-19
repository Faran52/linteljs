import { hasLibrary, hasTests } from '../../answers/answers';
import { targetFor } from '../../targets';
import { type Artifact, copied } from '../artifact';
import { setupTestsPath } from '../banned-patterns/bannedPatternsEmitter';

import type { Answers } from '../../answers/answers';
import type { TargetRecord } from '../../targets/record';
import type { ProjectShape } from '../projectShape';

// Import-free fragments after the target setup, so Angular's imports stay first.
const setupSources = (answers: Answers, target: TargetRecord): string[] => {
  return [
    target.testSetup ?? 'mocks/setupTests.ts',
    ...(target.routerMocks === true ? ['mocks/setupTests.router.ts'] : []),
    ...(hasLibrary(answers, 'tanstack-query') ? ['mocks/setupTests.tanstackQuery.ts'] : []),
  ];
};

// Preserved, so a project keeps its own mocks.
export const testSetupEmitter = (answers: Answers, project: ProjectShape): Artifact[] => {
  if (!hasTests(answers)) {
    return [];
  }

  const target = targetFor(answers);

  return [{
    ...copied(setupTestsPath(answers, project.setupTests), ...setupSources(answers, target)),
    preserve: true,
  }];
};
