import { type Artifact, type ProjectShape } from '@config/types';

import { type Answers, hasTests } from '@answers';
import { targetFor } from '@targets';

import { joined } from '../../utils/artifactUtils';
import { setupTestsPath } from '../../utils/shapeUtils';

import type { TargetRecord } from '@targets';

// Import-free fragments after the target setup, so Angular's imports stay first.
const setupSources = (answers: Answers, target: TargetRecord): string[] => {
  return [
    target.testSetup ?? 'fragments/test-setup/setupTests.ts',
    ...(target.routerMock === undefined ? [] : [target.routerMock]),
    ...(answers.data === 'tanstack-query' ? ['fragments/test-setup/setupTests.tanstackQuery.ts'] : []),
    // Last, so the interceptor is listening by the time anything else in the setup makes a request.
    ...(answers.mocking === 'msw' ? ['fragments/test-setup/setupTests.msw.ts'] : []),
  ];
};

// Preserved, so a project keeps its own mocks.
export const testSetupEmitter = (answers: Answers, project: ProjectShape): Artifact[] => {
  if (!hasTests(answers)) {
    return [];
  }

  const target = targetFor(answers);

  return [{
    ...joined(setupTestsPath(answers, project.setupTests), setupSources(answers, target)),
    preserve: true,
  }];
};
