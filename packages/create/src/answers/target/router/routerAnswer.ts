import type { Router } from '@config/types';
import type { OptionalChoiceRecord } from '../../types';

export const routerAnswer = {
  key: 'router',
  flag: 'router',
  prompt: 'Router',
  note: 'react only',
  slot: (target) => {
    return target.routers !== undefined;
  },
  kind: 'optionalChoice',
  none: {
    label: 'None',
    hint: 'A single page, or a router added later',
  },
  values: {
    'react-router': {
      label: 'React Router',
      hint: 'Declarative routes in src/App.tsx',
      only: (target) => {
        return target.routers?.includes('react-router') === true;
      },
    },
    // A mode of React Router, so a value rather than a new answer.
    'react-router-framework': {
      label: 'React Router, framework mode',
      hint: 'Server rendered, route modules and generated types',
      only: (target) => {
        return target.routers?.includes('react-router-framework') === true;
      },
    },
    'tanstack-router': {
      label: 'TanStack Router',
      hint: 'Type-safe routes built in src/App.tsx',
      only: (target) => {
        return target.routers?.includes('tanstack-router') === true;
      },
    },
  },
} as const satisfies OptionalChoiceRecord<Router>;
