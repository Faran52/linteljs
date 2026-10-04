import {
  describe,
  expect,
  it,
} from 'vitest';

import { commitGateEmitter } from './commitGateEmitter';

describe('commitGateEmitter', () => {
  it('copies the shipped configs, the staged typecheck and the logger from the paths they land on', () => {
    const commitGate = commitGateEmitter();
    const expected = [
      'lint-staged.config.js',
      'commitlint.config.js',
      'scripts/typecheckStaged.ts',
      'scripts/utils/typecheckStagedUtils.ts',
      'scripts/utils/loggerUtils.ts',
    ]
      .map((target) => {
        const artifact = {
          stage: 'standard',
          target,
          content: { sources: [`project/${target}`] },
        };

        return artifact;
      });
    expect(commitGate).toStrictEqual(expected);
  });
});
