import type { AnswerRecord } from '../../types';

export type Styling = keyof typeof stylingAnswer.values;

/**
 * Its own field rather than a member of `libraries`, for the reason the form library left in 1.7.0: at most one of
 * these is ever installed, and a single select is what says so. It is what `libraries` was hiding a single select
 * inside, which left the full library set illegal as a value of itself.
 *
 * Absent is a real answer rather than an omission. A project with no utility system still receives the tokens and
 * the starter stylesheet, which is one file every target shares.
 */
export const stylingAnswer = {
  key: 'styling',
  flag: 'styling',
  prompt: 'Styling',
  kind: 'optionalChoice',
  none: {
    label: 'None',
    hint: 'Plain CSS, with the tokens and the starter stylesheet',
  },
  values: {
    tailwind: {
      label: 'Tailwind CSS',
      hint: 'Utility-first styling; NativeWind on React Native',
    },
    stylex: {
      label: 'StyleX',
      hint: 'Compile-time atomic CSS with typed tokens',
      /**
       * Angular templates are HTML, so there is no spread site for `stylex.props`, and StyleX documents every
       * bundler it supports without documenting that one. React Native reaches native only through
       * `react-strict-dom`, which its own maintainers call not production ready; `DESIGN.md` already refused
       * NativeWind 4 for pinning that target to an older Tailwind, and this is the same call.
       */
      only: (target) => {
        return target.id !== 'angular' && target.id !== 'react-native';
      },
    },
  },
} as const satisfies AnswerRecord;
