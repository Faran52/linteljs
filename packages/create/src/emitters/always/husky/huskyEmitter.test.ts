import {
  describe,
  expect,
  it,
} from 'vitest';

import { huskyEmitter } from './huskyEmitter';

describe('huskyEmitter', () => {
  it('writes both hooks executable, the pre-commit one first', () => {
    expect(huskyEmitter()).toEqual([
      {
        stage: 'standard',
        target: '.husky/pre-commit',
        content: { sources: ['project/.husky/pre-commit'] },
        executable: true,
      },
      {
        stage: 'standard',
        target: '.husky/commit-msg',
        content: { sources: ['project/.husky/commit-msg'] },
        executable: true,
      },
    ]);
  });
});
