import {
  CONTACT,
  MOCKING_BASE,
  STYLEX_PLAIN_DATA,
  STYLEX_PURE_CALLS,
  SVELTE_GROUPS,
} from '../constants';

import type { Subject } from '../../utils/variantUtils';

export const SVELTEKIT_SUBJECTS: readonly Subject[] = [
  {
    shell: 'sveltekit',
    path: CONTACT,
    base: MOCKING_BASE,
    parameters: { './mocking': { question: 'mocking' } },
    groups: SVELTE_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
  {
    shell: 'sveltekit',
    path: 'src/routes/page.test.ts',
    base: 'sveltekit/routes/page.test.ts',
    parameters: { './store': { question: 'store', default: 'runes' } },
    groups: SVELTE_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
  {
    shell: 'sveltekit',
    path: 'src/views/home/HomeView.styles.ts',
    where: { styling: 'stylex' },
    base: 'shared/home-stylex/home.styles.ts',
    parameters: {
      './store': {
        question: 'store',
        files: { 'runes': 'store.ts', 'tanstack-store': 'store.counter.ts' },
      },
    },
    groups: SVELTE_GROUPS,
    plainData: STYLEX_PLAIN_DATA,
    pureCalls: STYLEX_PURE_CALLS,
    modules: {},
  },
  {
    shell: 'sveltekit',
    path: 'src/views/home/HomeView.styles.ts',
    where: { styling: 'css' },
    base: 'shared/home-css/home.styles.ts',
    parameters: {
      './store': {
        question: 'store',
        files: { 'runes': 'store.ts', 'tanstack-store': 'store.counter.ts' },
      },
    },
    groups: SVELTE_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
];
