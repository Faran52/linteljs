import type { AnswerRecord } from '../record';

export type Library = keyof typeof libraries.values;

export const libraries = {
  key: 'libraries',
  flag: 'libraries',
  prompt: 'Libraries',
  kind: 'multi',
  values: {
    'zod': {
      label: 'Zod',
      hint: 'Schema validation and parsing',
    },
    'tanstack-query': {
      label: 'TanStack Query',
      hint: 'Async data fetching and caching',
    },
    'tailwind': {
      label: 'Tailwind CSS',
      hint: 'Utility-first styling; NativeWind on React Native',
    },
    'es-toolkit': {
      label: 'es-toolkit',
      hint: 'Typed utility functions, the modern lodash',
    },
    'ts-pattern': {
      label: 'ts-pattern',
      hint: 'Exhaustive pattern matching',
    },
    't3-env': {
      label: 't3-env',
      hint: 'Zod-validated environment variables',
    },
  },
  default: ['tailwind'],
} as const satisfies AnswerRecord;
