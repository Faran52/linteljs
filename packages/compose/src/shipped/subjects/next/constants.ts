import {
  NEXT_GROUPS,
  STYLEX_PLAIN_DATA,
  STYLEX_PURE_CALLS,
} from '../constants';

import type { Subject } from '../../utils/variantUtils';

export const NEXT_SUBJECTS: readonly Subject[] = [
  {
    shell: 'next',
    path: 'src/app/page.test.tsx',
    base: 'next/home-page/page.test.tsx',
    parameters: { './store': { question: 'store' } },
    groups: NEXT_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
  {
    shell: 'next',
    path: 'src/app/page.styles.ts',
    where: { styling: 'stylex' },
    base: 'shared/home-stylex/home.styles.ts',
    parameters: {
      './store': {
        question: 'store',
        files: { 'libraries': 'store.counter.ts', 'react-state': 'store.ts' },
      },
    },
    groups: NEXT_GROUPS,
    plainData: STYLEX_PLAIN_DATA,
    pureCalls: STYLEX_PURE_CALLS,
    modules: {},
  },
  {
    shell: 'next',
    path: 'src/app/page.tsx',
    where: { styling: 'atomic' },
    base: 'next/page/page.tsx',
    parameters: { './store': { question: 'store' } },
    groups: NEXT_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
];
