import {
  EXPO_GROUPS,
} from '../constants.ts';

import type { Subject } from '../../utils/composeUtils.ts';

export const EXPO_SUBJECTS: readonly Subject[] = [
  {
    shell: 'expo',
    path: 'src/app-layout.test.tsx',
    base: 'expo/app-layout/app-layout.test.tsx',
    parameters: { './styling': { question: 'styling' } },
    groups: EXPO_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
];
