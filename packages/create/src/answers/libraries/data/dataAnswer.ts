import type { Data } from '@config/types';
import type { OptionalChoiceRecord } from '../../types';

/**
 * Its own field, like the form library and `styling`: TanStack Query and RTK Query are the same job, so at most one
 * is installed and a single select is what refuses the other.
 *
 * Redux for client state with TanStack Query for server state is a real architecture, so `tanstack-query` is
 * offered with every store. Only `rtk-query` carries a constraint, and it is the store's rather than the target's.
 */
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
      // Not a dependency of its own: it is `@reduxjs/toolkit`, and it needs that store's reducer and middleware.
      only: (_target, answered) => {
        return answered.store === 'redux-toolkit';
      },
    },
  },
} as const satisfies OptionalChoiceRecord<Data>;
