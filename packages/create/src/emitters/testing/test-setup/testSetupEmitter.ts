import {
  type Answers,
  hasLibrary,
  hasTests,
} from '../../../answers';
import { type Artifact, type ProjectShape } from '../../../config/types';
import { targetFor } from '../../../targets';
import { setupTestsPath } from '../../always/banned-patterns/bannedPatternsEmitter';
import { copied } from '../../utils/artifactUtils';

import type { TargetRecord } from '../../../targets/types';

// Import-free fragments after the target setup, so Angular's imports stay first.
const setupSources = (answers: Answers, target: TargetRecord): string[] => {
  return [
    target.testSetup ?? 'testing/test-setup/setupTests.ts',
    ...(target.routerMocks === true ? ['testing/test-setup/setupTests.router.ts'] : []),
    ...(hasLibrary(answers, 'tanstack-query') ? ['testing/test-setup/setupTests.tanstackQuery.ts'] : []),
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
