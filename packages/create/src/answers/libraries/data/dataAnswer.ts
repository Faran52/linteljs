import type { Data } from '@config/types';
import type { OptionalChoiceRecord } from '../../types';

// A single select refuses a second data layer; `tanstack-query` pairs with every store.
export const dataAnswer = {
  key: 'data',
  flag: 'data',
  prompt: 'Data fetching',
  kind: 'optionalChoice',
  none: {
    label: 'None',
    hint: 'Call the api layer directly',
  },
  values: {
    'tanstack-query': {
      label: 'TanStack Query',
      hint: 'Async caching, bound to your framework',
    },
    'rtk-query': {
      label: 'RTK Query',
      hint: 'Redux Toolkit only, since it ships inside it',
      // `rtk-query` is `@reduxjs/toolkit`, and needs that store's reducer and middleware.
      only: (_target, answered) => {
        return answered.store === 'redux-toolkit';
      },
    },
  },
} as const satisfies OptionalChoiceRecord<Data>;
