import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';

import { testSetupEmitter } from './testSetupEmitter';

import type { ProjectShape } from '@config/types';

// A project that holds neither spelling, so the target's own is the one written.
const FRESH: ProjectShape = {
  setupTests: [],
  styleEntries: [],
};

describe('testSetupEmitter', () => {
  it('writes nothing for a project that asked for no tests', () => {
    expect(testSetupEmitter({
      ...DEFAULT_ANSWERS,
      testing: 'none',
    }, FRESH)).toEqual([]);
  });

  // Preserved, so a project keeps the mocks it added to the file after the first run.
  it('joins the target setup and its router mocks into the spelling React needs', () => {
    expect(testSetupEmitter(DEFAULT_ANSWERS, FRESH)).toEqual([{
      stage: 'standard',
      target: '__mocks__/setupTests.tsx',
      content: {
        sources: [
          'fragments/test-setup/setupTests.ts',
          'fragments/test-setup/setupTests.router.ts',
        ],
      },
      preserve: true,
    }]);
  });

  it('appends the fragment a selected library brings', () => {
    const [artifact] = testSetupEmitter({
      ...DEFAULT_ANSWERS,
      libraries: ['tanstack-query'],
    }, FRESH);

    expect(artifact?.content).toHaveProperty('sources', [
      'fragments/test-setup/setupTests.ts',
      'fragments/test-setup/setupTests.router.ts',
      'fragments/test-setup/setupTests.tanstackQuery.ts',
    ]);
  });

  // The target's own file first: it is the one with imports, and the fragments after it have none.
  it('leads with the target setup where the target ships one', () => {
    const [artifact] = testSetupEmitter({
      ...DEFAULT_ANSWERS,
      target: 'angular',
    }, FRESH);

    expect(artifact?.content).toHaveProperty('sources', ['fragments/test-setup/setupTests.angular.ts']);
  });
});
