import type { Styling } from '@config/types';
import type { OptionalChoiceRecord } from '../../types';

/**
 * Its own field rather than a member of `libraries`: at most one of these is ever installed, and a single select
 * is what says so.
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
       * `react-strict-dom`, which its own maintainers call not production ready; `docs/DESIGN.md` already refused
       * NativeWind 4 for pinning that target to an older Tailwind, and this is the same call.
       */
      only: (target) => {
        return target.id !== 'angular' && target.id !== 'react-native';
      },
    },
  },
} as const satisfies OptionalChoiceRecord<Styling>;
