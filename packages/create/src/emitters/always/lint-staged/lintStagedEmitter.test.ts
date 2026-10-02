import {
  describe,
  expect,
  it,
} from 'vitest';

import { lintStagedEmitter } from './lintStagedEmitter';

describe('lintStagedEmitter', () => {
  it('copies the shipped config from the path it lands on', () => {
    const lintStaged = lintStagedEmitter();
    const expected = [{
      stage: 'standard',
      target: 'lint-staged.config.js',
      content: { sources: ['project/lint-staged.config.js'] },
    }];
    expect(lintStaged).toEqual(expected);
  });
});
