import {
  describe,
  expect,
  it,
} from 'vitest';

import { typecheckStagedEmitter } from './typecheckStagedEmitter';

describe('typecheckStagedEmitter', () => {
  it('copies the shipped script and its utils from the paths they land on', () => {
    const typecheckStaged = typecheckStagedEmitter();
    const expected = [
      {
        stage: 'standard',
        target: 'scripts/typecheckStaged.ts',
        content: { sources: ['project/scripts/typecheckStaged.ts'] },
      },
      {
        stage: 'standard',
        target: 'scripts/utils/typecheckStagedUtils.ts',
        content: { sources: ['project/scripts/utils/typecheckStagedUtils.ts'] },
      },
    ];
    expect(typecheckStaged).toEqual(expected);
  });
});
