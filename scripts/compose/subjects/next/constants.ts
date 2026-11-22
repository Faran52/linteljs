import {
  REACT_GROUPS,
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
];
