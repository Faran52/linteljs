import {
  REACT_GROUPS,
  STYLEX_PLAIN_DATA,
  STYLEX_PURE_CALLS,
} from '../constants.ts';

import type { Subject } from '../../utils/composeUtils.ts';

export const NEXT_SUBJECTS: readonly Subject[] = [
  {
    base: 'next/home-page/page.test.tsx',
    groups: REACT_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      {
        options: { './store': 'store.libraries.tsx' },
        shipped: 'next/store/libraries/testing/vitest/src/app/page.test.tsx',
      },
      {
        options: { './store': 'store.react-state.tsx' },
        shipped: 'next/data/redux-free/store/react-state/testing/vitest/src/app/page.test.tsx',
      },
    ],
  },
  {
    base: 'next/home-page-styles/page.styles.ts',
    groups: REACT_GROUPS,
    plainData: STYLEX_PLAIN_DATA,
    pureCalls: STYLEX_PURE_CALLS,
    modules: {},
    variants: [
      {
        options: { './store': 'store.libraries.ts' },
        shipped: 'next/store/libraries/styling/stylex/src/app/page.styles.ts',
      },
      {
        options: { './store': 'store.react-state.ts' },
        shipped: 'next/data/redux-free/store/react-state/styling/stylex/src/app/page.styles.ts',
      },
    ],
  },
  {
    base: 'next/page/page.tsx',
    groups: REACT_GROUPS,
    plainData: STYLEX_PLAIN_DATA,
    pureCalls: STYLEX_PURE_CALLS,
    modules: {},
    variants: [
      {
        options: { './store': 'store.libraries.tsx' },
        shipped: 'next/store/libraries/styling/atomic/src/app/page.tsx',
      },
      {
        options: { './store': 'store.react-state.tsx' },
        shipped: 'next/data/redux-free/store/react-state/styling/atomic/src/app/page.tsx',
      },
    ],
  },
];
