import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { coverageExclude, coverageInclude } from './coverageUtils';

import type { Answers, TargetId } from '@config/types';

describe('coverageInclude', () => {
  it.each<[TargetId, string]>([
    ['react', ''],
    ['svelte', ',svelte'],
    ['vue', ',vue'],
  ])('measures only what can be instrumented on %s, plus its component format', (target, format) => {
    const actual = coverageInclude(answersFor({ target }));
    expect(actual).toBe(`src/**/*.{ts,tsx,mts,js,jsx,mjs${format}}`);
  });
});

describe('coverageExclude', () => {
  it.each<[string, Partial<Answers>, string[]]>([
    [
      'react',
      { target: 'react' },
      [],
    ],
    [
      'react in framework mode',
      {
        target: 'react',
        router: 'react-router-framework',
      },
      ['src/root.tsx', 'src/routes/**'],
    ],
    [
      'next',
      { target: 'next' },
      ['src/app/layout.tsx', 'src/app/global-error.tsx'],
    ],
    [
      'vue',
      { target: 'vue' },
      [],
    ],
    [
      'nuxt',
      { target: 'nuxt' },
      [],
    ],
    [
      'svelte',
      { target: 'svelte' },
      ['src/routes/+layout.svelte'],
    ],
    [
      'solid',
      { target: 'solid' },
      [],
    ],
    [
      'angular',
      { target: 'angular' },
      ['src/app/app.config.ts', 'src/app/app.routes.ts'],
    ],
    [
      'astro',
      { target: 'astro' },
      [],
    ],
    [
      'webextension',
      { target: 'webextension' },
      ['src/background/index.ts'],
    ],
    [
      'a webextension with a popup alone',
      {
        target: 'webextension',
        surfaces: ['popup'],
      },
      [],
    ],
    [
      'a webextension with a devtools panel',
      {
        target: 'webextension',
        surfaces: ['devtools-panel'],
      },
      [
        'src/config/linteljs.ts',
        'src/devtools/index.ts',
        'src/panel/index.ts',
      ],
    ],
    [
      'react-native',
      { target: 'react-native' },
      [],
    ],
  ])('leaves out of coverage on %s only what it cannot execute', (_label, overrides, excluded) => {
    const answers = answersFor(overrides);
    const actual = coverageExclude(answers);
    const expected = [
      '**/*.test.*',
      '**/*.d.ts',
      'src/typings/**',
      'src/{main,index}.{ts,tsx}',
      '**/*.stylex.{ts,tsx}',
      '**/components/**/styles.{ts,tsx}',
      ...excluded,
    ];
    expect(actual).toEqual(expected);
  });

  it('keeps out a React Router route table, not a TanStack Router one', () => {
    const routed = coverageExclude(answersFor({ router: 'react-router' }));
    expect(routed).toContain('src/routes/**');
    const tanstack = coverageExclude(answersFor({ router: 'tanstack-router' }));
    expect(tanstack).not.toContain('src/routes/**');
  });
});
