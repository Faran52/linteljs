import type { AnswerRecord } from '../types';

export type TypeSafety = keyof typeof typeSafety.values;

export const typeSafety = {
  key: 'typeSafety',
  flag: 'type-safety',
  prompt: 'Type safety',
  kind: 'choice',
  values: {
    strict: {
      label: 'Strict',
      hint: 'Bans casts, any and suppression directives',
    },
    relaxed: {
      label: 'Relaxed',
      hint: 'Only what the compiler itself catches',
    },
  },
  default: 'strict',
} as const satisfies AnswerRecord;
