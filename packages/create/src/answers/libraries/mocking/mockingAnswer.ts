import type { Mocking } from '@config/types';
import type { OptionalChoiceRecord } from '../../types';

export const mockingAnswer = {
  key: 'mocking',
  flag: 'mocking',
  prompt: 'API mocking',
  note: 'not on typescript or webextension',
  slot: (target) => {
    return target.noContactPage !== true;
  },
  kind: 'optionalChoice',
  none: {
    label: 'None',
    hint: 'The api layer answers locally, with no request to intercept',
  },
  values: {
    msw: {
      label: 'MSW',
      hint: 'Handlers that answer real requests, in the browser and in tests',
    },
  },
} as const satisfies OptionalChoiceRecord<Mocking>;
