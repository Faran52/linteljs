import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { shippedAssetsReader } from '@disk';

import { commitGateEmitter } from './commitGateEmitter';

describe('commitGateEmitter', () => {
  it('copies the shipped configs, the staged typecheck and the logger from the paths they land on', () => {
    const commitGate = commitGateEmitter(answersFor({}));
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

describe('the monorepo layout', () => {
  it('runs the scripts at the git root from the app', async () => {
    const [lintStaged] = commitGateEmitter(answersFor({ layout: 'monorepo' }));
    const text = lintStaged === undefined ? '' : await shippedAssetsReader(lintStaged.content);
    expect(text).toContain('`node ../../scripts/checkBannedPatterns.ts ${files}`');
    expect(text).toContain('`node ../../scripts/typecheckStaged.ts ${files}`');
  });
});
