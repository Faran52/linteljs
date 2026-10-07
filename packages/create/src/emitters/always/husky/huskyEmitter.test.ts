import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { shippedAssetsReader } from '@disk';

import { huskyEmitter } from './huskyEmitter';

describe('huskyEmitter', () => {
  it('writes both hooks executable, the pre-commit one first', () => {
    const husky = huskyEmitter(answersFor({}));
    const expected = [
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
    ];
    expect(husky).toEqual(expected);
  });
});

describe('the monorepo layout', () => {
  it('lets lint-staged find each package config', async () => {
    const [preCommit] = huskyEmitter(answersFor({ layout: 'monorepo' }));
    const text = preCommit === undefined ? '' : await shippedAssetsReader(preCommit.content);
    expect(text).toBe('npx lint-staged\n');
  });
});
