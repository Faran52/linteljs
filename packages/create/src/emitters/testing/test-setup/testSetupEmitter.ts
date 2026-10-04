import {
  type Answers,
  type Artifact,
  type ProjectShape,
} from '@config/types';

import { hasTests, localesOf } from '@utils/answerUtils';

import { targetFor, type TargetRecord } from '@targets';

import { TEST_RUNNERS } from '../../constants';
import { joined } from '../../utils/artifactUtils';
import { setupTestsPath } from '../../utils/shapeUtils';

// Import-free fragments after the target setup, so Angular's imports stay first.
const setupSources = (answers: Answers, target: TargetRecord): string[] => {
  const sources: string[] = [
    target.testSetup ?? 'fragments/test-setup/setupTests.ts',
    ...(target.routerMock === undefined ? [] : [target.routerMock]),
    ...(answers.data === 'tanstack-query' ? ['fragments/test-setup/setupTests.tanstackQuery.ts'] : []),
    ...(localesOf(answers).length === 0 || target.i18n?.testSetup === undefined ? [] : [target.i18n.testSetup]),
    // Last, so the interceptor is listening by the time anything else in the setup makes a request.
    ...(answers.mocking === 'msw' ? [TEST_RUNNERS[target.testRunner ?? 'vitest'].mswSetup] : []),
  ];

  return sources;
};

// Preserved, so a project keeps its own mocks.
export const testSetupEmitter = (answers: Answers, project: ProjectShape): Artifact[] => {
  if (!hasTests(answers)) {
    return [];
  }

  const target = targetFor(answers);

  const path = setupTestsPath(answers, project.setupTests);
  const sources = setupSources(answers, target);
  const artifacts: Artifact[] = [{
    ...joined(path, sources),
    preserve: true,
  }];

  return artifacts;
};
