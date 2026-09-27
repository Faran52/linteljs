import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';

import { npmrcEmitter } from './npmrcEmitter';

describe('npmrcEmitter', () => {
  it('writes nothing for a manager that takes its own peer allowance', () => {
    const artifacts = npmrcEmitter({
      ...DEFAULT_ANSWERS,
      packageManager: 'pnpm',
    });

    expect(artifacts).toEqual([]);
  });

  it('emits the one line npm needs to install at all', () => {
    const artifacts = npmrcEmitter({
      ...DEFAULT_ANSWERS,
      packageManager: 'npm',
    });

    expect(artifacts).toEqual([{
      stage: 'standard',
      target: '.npmrc',
      content: { text: 'legacy-peer-deps=true\n' },
    }]);
  });
});
