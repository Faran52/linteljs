import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';

import { bunfigEmitter } from './bunfigEmitter';

import type { PackageManager } from '@config/types';

describe('bunfigEmitter', () => {
  it('holds a bun release two days back, the linteljs packages exempt', () => {
    const artifacts = bunfigEmitter({
      ...DEFAULT_ANSWERS,
      packageManager: 'bun',
    });

    expect(artifacts).toEqual([{
      stage: 'package',
      target: 'bunfig.toml',
      content: {
        text: '[install]\nminimumReleaseAge = 172800\n'
          + 'minimumReleaseAgeExcludes = ["@linteljs/eslint-config", "@linteljs/eslint-plugin"]\n',
      },
    }]);
  });

  it.each<PackageManager>([
    'pnpm',
    'npm',
    'yarn',
  ])('writes nothing for %s', (packageManager) => {
    const artifacts = bunfigEmitter({
      ...DEFAULT_ANSWERS,
      packageManager,
    });

    expect(artifacts).toEqual([]);
  });
});
