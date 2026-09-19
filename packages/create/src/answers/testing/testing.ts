import type { AnswerRecord } from '../types';

export type Testing = keyof typeof testing.values;

export const testing = {
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
} as const satisfies AnswerRecord;
