import {
  describe,
  expect,
  it,
} from 'vitest';

import { ANSWERS, DEFAULT_ANSWERS } from '@answers';

import { answerFlags } from './workspaceUtils';

/*
 * Every answer the CLI names a flag for has to reach the CLI, or the suite generates a project from answers it
 * never gave and asserts against the ones it meant. That is not hypothetical: `styling` and `data` were added in
 * v2 and this list was not, so five cases per target generated plain CSS and no data layer while claiming
 * otherwise, and the only thing that caught it was the config they wrote back.
 *
 * A record with no `flag` is one no prompt asks and no argument sets: the package manager comes from the user
 * agent, and the rest are recorded off the machine that ran the CLI.
 */
describe('answerFlags', () => {
  it('passes a flag for every answer the CLI names one for', () => {
    const named = Object.values(ANSWERS).flatMap((record) => {
      return 'flag' in record ? [`--${record.flag}`] : [];
    });
    // Two sets, since a browser is asked only of the extension and a router only of the targets that offer one.
    const passed = new Set([
      ...answerFlags({
        ...DEFAULT_ANSWERS,
        target: 'react',
        form: 'tanstack-form',
        router: 'react-router',
        store: 'zustand',
        styling: 'tailwind',
        data: 'tanstack-query',
        mocking: 'msw',
      }),
      ...answerFlags({
        ...DEFAULT_ANSWERS,
        target: 'webextension',
        hostedFramework: 'react',
        surfaces: ['popup'],
      }),
    ]);

    expect(named.filter((flag) => {
      return !passed.has(flag);
    })).toEqual([]);
  });
});
