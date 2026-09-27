import type { Testing } from '@config/types';
import type { ChoiceRecord } from '../../types';

export const testingAnswer = {
  key: 'testing',
  flag: 'testing',
  prompt: 'Testing',
  kind: 'choice',
  values: {
    vitest: {
      label: 'Vitest',
      hint: 'Test runner with built-in coverage',
    },
    none: {
      label: 'None',
      hint: 'No test suite',
    },
  },
  default: 'vitest',
} as const satisfies ChoiceRecord<Testing>;
