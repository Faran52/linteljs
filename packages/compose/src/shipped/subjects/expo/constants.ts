import { EXPO_GROUPS } from '../constants';

import type { Subject } from '../../utils/variantUtils';

export const EXPO_SUBJECTS: readonly Subject[] = [
  {
    shell: 'expo',
    path: 'src/app-layout.test.tsx',
    base: 'expo/app-layout/app-layout.test.tsx',
    parameters: { './styling': { question: 'styling', default: 'css' } },
    groups: EXPO_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
  {
    shell: 'expo',
    path: 'src/app/_layout.tsx',
    base: 'expo/app-layout/_layout.tsx',
    parameters: { './globalStyles': { question: 'styling', default: 'css' } },
    groups: EXPO_GROUPS,
    plainData: [],
    pureCalls: [],
    modules: {},
  },
];
