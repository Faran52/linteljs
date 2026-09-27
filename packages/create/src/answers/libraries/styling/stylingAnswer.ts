import type { Styling } from '@config/types';
import type { OptionalChoiceRecord } from '../../types';

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
      // Angular templates have no spread site for `stylex.props`; React Native would need `react-strict-dom`.
      only: (target) => {
        return target.id !== 'angular' && target.id !== 'react-native';
      },
    },
  },
} as const satisfies OptionalChoiceRecord<Styling>;
