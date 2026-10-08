import type { Testing } from '@config/types';
import type { ChoiceRecord } from '../../types';

export const testingAnswer = {
  key: 'testing',
  flag: 'testing',
  prompt: 'Testing',
  note: 'jest on react-native, vitest elsewhere',
  kind: 'choice',
  values: {
    vitest: {
      label: 'Vitest',
      hint: 'Test runner with built-in coverage',
      only: (target) => {
        return target.testRunner === undefined;
      },
    },
    jest: {
      label: 'Jest',
      hint: 'Through jest-expo, the runner Expo tests against',
      only: (target) => {
        return target.testRunner === 'jest';
      },
    },
    none: {
      label: 'None',
      hint: 'No test suite',
    },
  },
  default: 'vitest',
} as const satisfies ChoiceRecord<Testing>;
