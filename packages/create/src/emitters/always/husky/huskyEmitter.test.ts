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
    const hooks = huskyEmitter(answersFor({}));
    const husky = hooks
      .map(({ content, ...rest }) => {
        const shape = {
          ...rest,
          sources: 'sources' in content ? content.sources : [],
        };

        return shape;
      });
    const expected = [
      {
        stage: 'standard',
        target: '.husky/pre-commit',
        sources: ['project/.husky/pre-commit'],
        executable: true,
      },
      {
        stage: 'standard',
        target: '.husky/commit-msg',
        sources: ['project/.husky/commit-msg'],
        executable: true,
      },
    ];
    expect(husky).toEqual(expected);
  });

  it.each([
    ['pnpm', 'pnpm exec lint-staged --config lint-staged.config.js\npnpm exec commitlint --edit "$1"\n'],
    ['npm', 'npx lint-staged --config lint-staged.config.js\nnpx commitlint --edit "$1"\n'],
    ['yarn', 'yarn lint-staged --config lint-staged.config.js\nyarn commitlint --edit "$1"\n'],
    ['bun', 'bunx lint-staged --config lint-staged.config.js\nbunx commitlint --edit "$1"\n'],
  ] as const)('runs each hook through %s, which npm devEngines does not refuse', async (packageManager, expected) => {
    const hooks = huskyEmitter(answersFor({ packageManager }));
    const texts = await Promise.all(hooks
      .map(async ({ content }) => {
        return shippedAssetsReader(content);
      }));
    const joined = texts.join('');
    expect(joined).toBe(expected);
  });
});

describe('the monorepo layout', () => {
  it('lets lint-staged find each package config', async () => {
    const [preCommit] = huskyEmitter(answersFor({ layout: 'monorepo', packageManager: 'npm' }));
    const text = preCommit === undefined ? '' : await shippedAssetsReader(preCommit.content);
    expect(text).toBe('npx lint-staged\n');
  });
});
