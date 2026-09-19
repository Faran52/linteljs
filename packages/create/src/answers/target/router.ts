import type { AnswerRecord } from '../types';

// Named ahead of the record rather than derived from `values` below: `TargetRecord.routers` is typed with this,
// and a value's own `only` reads `target.routers`, which would otherwise need this file's own export to resolve.
export type Router = 'react-router' | 'tanstack-router';

export const router = {
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
      hint: 'Declarative routes in src/routes/router.tsx',
      only: (target) => {
        return target.routers?.includes('react-router') === true;
      },
    },
    'tanstack-router': {
      label: 'TanStack Router',
      hint: 'Type-safe file routes under src/routes/',
      only: (target) => {
        return target.routers?.includes('tanstack-router') === true;
      },
    },
  },
} as const satisfies AnswerRecord;
