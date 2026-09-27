import type { TypeSafety } from '@config/types';
import type { ChoiceRecord } from '../../types';

export const typeSafetyAnswer = {
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
} as const satisfies ChoiceRecord<TypeSafety>;
