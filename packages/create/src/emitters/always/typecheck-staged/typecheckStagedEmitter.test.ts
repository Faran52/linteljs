import {
  describe,
  expect,
  it,
} from 'vitest';

import { typecheckStagedEmitter } from './typecheckStagedEmitter';

describe('typecheckStagedEmitter', () => {
  it('copies the shipped script from the path it lands on', () => {
    const typecheckStaged = typecheckStagedEmitter();
    const expected = [{
      stage: 'standard',
      target: 'scripts/typecheckStaged.ts',
      content: { sources: ['project/scripts/typecheckStaged.ts'] },
    }];
    expect(typecheckStaged).toEqual(expected);
  });
});
