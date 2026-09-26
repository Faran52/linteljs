import type { AnswerRecord } from '../../types';

// Named ahead of the record rather than derived from `values` below: `TargetRecord.routers` is typed with this,
// and a value's own `only` reads `target.routers`, which would otherwise need this file's own export to resolve.
export type Router = 'react-router' | 'react-router-framework' | 'tanstack-router';

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
      hint: 'Declarative routes in src/routes/router.tsx',
      only: (target) => {
        return target.routers?.includes('react-router') === true;
      },
    },
    /*
     * React Router's own framework mode, which is a mode of that router rather than a router of its own: it is the
     * same library with its build, its route module and its generated types turned on. A third value here rather
     * than a new answer, because this is the question that already decides which router a project gets.
     */
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
} as const satisfies AnswerRecord;
