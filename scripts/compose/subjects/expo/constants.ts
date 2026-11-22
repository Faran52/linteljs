import {
  EXPO_GROUPS,
} from '../constants.ts';

import type { Subject } from '../../utils/composeUtils.ts';

export const EXPO_SUBJECTS: readonly Subject[] = [
  {
    base: 'expo/app-layout/app-layout.test.tsx',
    groups: EXPO_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
    variants: [
      {
        options: { './styling': 'styling.css.ts' },
        shipped: 'expo/testing/jest/styling/css/src/app-layout.test.tsx',
      },
      {
        options: { './styling': 'styling.tailwind.ts' },
        shipped: 'expo/testing/jest/styling/tailwind/src/app-layout.test.tsx',
      },
    ],
  },
];
