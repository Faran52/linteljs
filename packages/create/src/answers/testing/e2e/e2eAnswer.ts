import type { E2e } from '@config/types';
import type { OptionalChoiceRecord } from '../../types';

export const e2eAnswer = {
  key: 'e2e',
  flag: 'e2e',
  prompt: (target) => {
    return target.id === 'react-native' ? 'E2E testing (Maestro)' : 'E2E testing (Playwright)';
  },
  note: 'maestro on react-native only; not on typescript',
  slot: (target) => {
    return target.id !== 'typescript';
  },
  kind: 'optionalChoice',
  none: {
    label: 'None',
    hint: 'No end-to-end suite',
  },
  values: {
    playwright: {
      label: 'Playwright',
      hint: 'Browser tests against the built app',
      only: (target) => {
        return target.id !== 'react-native';
      },
    },
    maestro: {
      label: 'Maestro',
      hint: 'Flows on a simulator or an emulator',
      only: (target) => {
        return target.id === 'react-native';
      },
    },
  },
} as const satisfies OptionalChoiceRecord<E2e>;
