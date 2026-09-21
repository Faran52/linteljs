import {
  describe,
  expect,
  it,
} from 'vitest';

import { commitlintEmitter } from './commitlintEmitter';

describe('commitlintEmitter', () => {
  it('copies the shipped config from the path it lands on', () => {
    expect(commitlintEmitter()).toEqual([{
      stage: 'standard',
      target: 'commitlint.config.js',
      content: { sources: ['project/commitlint.config.js'] },
    }]);
  });
});
