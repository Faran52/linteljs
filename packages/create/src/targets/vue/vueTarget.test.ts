import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';

import { vueTarget } from './vueTarget';

describe('scaffold', () => {
  it('writes the exact argv for the default answers', () => {
    expect(vueTarget.scaffold('demo-app', DEFAULT_ANSWERS)).toEqual({
      kind: 'create',
      args: ['vue@latest', 'demo-app', '--ts', '--router', '--vitest'],
    });
  });

  // The one scaffolder wired to the store answer: create-vue installs Pinia itself, so the flag is the whole mechanism.
  it('passes --pinia only when the store answer is yes', () => {
    expect(vueTarget.scaffold('demo-app', {
      ...DEFAULT_ANSWERS,
      store: true,
    }).args).toContain('--pinia');
    expect(vueTarget.scaffold('demo-app', DEFAULT_ANSWERS).args).not.toContain('--pinia');
  });

  it('appends --vitest unless testing is declined', () => {
    const withVitest = vueTarget.scaffold('demo-app', {
      ...DEFAULT_ANSWERS,
      testing: 'vitest',
    });
    const withoutVitest = vueTarget.scaffold('demo-app', {
      ...DEFAULT_ANSWERS,
      testing: 'none',
    });

    expect(withVitest.args).toContain('--vitest');
    expect(withoutVitest.args).not.toContain('--vitest');
  });
});
