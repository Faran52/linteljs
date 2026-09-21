import {
  describe,
  expect,
  it,
} from 'vitest';

import { typecheckStagedEmitter } from './typecheckStagedEmitter';

describe('typecheckStagedEmitter', () => {
  it('copies the shipped script from the path it lands on', () => {
    expect(typecheckStagedEmitter()).toEqual([{
      stage: 'standard',
      target: 'scripts/typecheckStaged.ts',
      content: { sources: ['project/scripts/typecheckStaged.ts'] },
    }]);
  });
});
