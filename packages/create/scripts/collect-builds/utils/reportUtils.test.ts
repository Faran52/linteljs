import {
  describe,
  expect,
  it,
} from 'vitest';

import { reportLines } from './reportUtils.ts';

describe('reportLines', () => {
  it('tables each target with what npm alone blocks, then the sorted union and the npm-only list', () => {
    const lines = reportLines([
      ['react', {
        pnpm: ['esbuild'],
        npm: [
          'esbuild',
          'fsevents',
          '@swc/core',
        ],
      }],
      ['node', {
        pnpm: [],
        npm: [],
      }],
    ]);

    expect(lines).toEqual([
      [
        `  ${'target'.padEnd(28)}${'pnpm'.padEnd(46)}npm only`,
        `  ${'react'.padEnd(28)}${'esbuild'.padEnd(46)}fsevents, @swc/core`,
        `  ${'node'.padEnd(28)}${'(none)'.padEnd(46)}-`,
      ].join('\n'),
      'Union, for allowBuilds:\n  \'@swc/core\'\n  \'esbuild\'\n  \'fsevents\'',
      'Blocked by npm and not by pnpm, which is what NPM_ALLOWED_BUILDS holds:\n  \'@swc/core\'\n  \'fsevents\'',
    ]);
  });

  it('answers none for an empty union', () => {
    const lines = reportLines([]);

    const lists = lines.slice(1);

    expect(lists).toEqual([
      'Union, for allowBuilds:\n  (none)',
      'Blocked by npm and not by pnpm, which is what NPM_ALLOWED_BUILDS holds:\n  (none)',
    ]);
  });
});
