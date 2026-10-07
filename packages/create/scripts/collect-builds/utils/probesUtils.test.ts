import {
  describe,
  expect,
  it,
} from 'vitest';

import { keysOf } from '@utils/objectUtils';

import { ANSWERS } from '../../../src/answers';

import { probes } from './probesUtils.ts';

describe('probes', () => {
  it('answers one probe per target and per framework a target hosts, with its first store and router', () => {
    const summary = probes()
      .map(({ label, answers }) => {
        const row = [
          label,
          answers.store,
          answers.router,
          answers.hostedFramework,
          answers.surfaces,
        ];

        return row;
      });

    const surfaces = [
      'popup',
      'background',
      'devtools-panel',
    ];

    expect(summary).toEqual([
      [
        'react',
        'zustand',
        'react-router',
        undefined,
        undefined,
      ],
      [
        'next',
        'zustand',
        undefined,
        undefined,
        undefined,
      ],
      [
        'vue',
        'pinia',
        undefined,
        undefined,
        undefined,
      ],
      [
        'nuxt',
        'pinia',
        undefined,
        undefined,
        undefined,
      ],
      [
        'svelte',
        'tanstack-store',
        undefined,
        undefined,
        undefined,
      ],
      [
        'solid',
        'tanstack-store',
        undefined,
        undefined,
        undefined,
      ],
      [
        'angular',
        'ngrx-signals',
        undefined,
        undefined,
        undefined,
      ],
      [
        'astro',
        'nanostores',
        undefined,
        undefined,
        undefined,
      ],
      [
        'astro hosting react',
        'nanostores',
        undefined,
        'react',
        undefined,
      ],
      [
        'astro hosting vue',
        'nanostores',
        undefined,
        'vue',
        undefined,
      ],
      [
        'astro hosting svelte',
        'nanostores',
        undefined,
        'svelte',
        undefined,
      ],
      [
        'astro hosting solid',
        'nanostores',
        undefined,
        'solid',
        undefined,
      ],
      [
        'webextension',
        undefined,
        undefined,
        undefined,
        surfaces,
      ],
      [
        'webextension hosting react',
        undefined,
        undefined,
        'react',
        surfaces,
      ],
      [
        'webextension hosting vue',
        undefined,
        undefined,
        'vue',
        surfaces,
      ],
      [
        'webextension hosting svelte',
        undefined,
        undefined,
        'svelte',
        surfaces,
      ],
      [
        'webextension hosting solid',
        undefined,
        undefined,
        'solid',
        surfaces,
      ],
      [
        'react-native',
        'zustand',
        undefined,
        undefined,
        undefined,
      ],
      [
        'typescript',
        undefined,
        undefined,
        undefined,
        undefined,
      ],
    ]);
  });

  it('turns every library, agent and plugin on, with vitest and tanstack-form', () => {
    const everything = {
      libraries: keysOf(ANSWERS.libraries.values),
      agents: keysOf(ANSWERS.agents.values),
      plugins: keysOf(ANSWERS.plugins.values),
      testing: 'vitest',
      form: 'tanstack-form',
    };

    const chosen = probes()
      .map(({ answers }) => {
        const picked = {
          libraries: answers.libraries,
          agents: answers.agents,
          plugins: answers.plugins,
          testing: answers.testing,
          form: answers.form,
        };

        return picked;
      });

    const expected = Array.from({ length: 19 }, () => {
      return everything;
    });
    expect(chosen).toEqual(expected);
  });
});
