import type { AnswerRecord } from '../../types';

// Named ahead of the record for the same reason as `Router`: `TargetRecord.stores` is typed with this, and each
// value's own `only` reads `target.stores`, which would otherwise need this file's own export to resolve.
export type Store
  = 'zustand'
    | 'redux-toolkit'
    | 'tanstack-store'
    | 'pinia'
    | 'ngrx-signals'
    | 'ngrx-store'
    | 'nanostores';

// A target offers the stores its framework's people actually reach for; the record says what each one is.
export const storeAnswer = {
  key: 'store',
  flag: 'store',
  prompt: 'State store',
  slot: (target) => {
    return target.stores !== undefined;
  },
  kind: 'optionalChoice',
  none: {
    label: 'None',
    hint: "The framework's own state, and nothing installed",
  },
  values: {
    'zustand': {
      label: 'Zustand',
      hint: 'A hook and a store, with no provider',
      only: (target) => {
        return target.stores?.includes('zustand') === true;
      },
    },
    'redux-toolkit': {
      label: 'Redux Toolkit',
      hint: 'Slices, and RTK Query for data fetching',
      only: (target) => {
        return target.stores?.includes('redux-toolkit') === true;
      },
    },
    'tanstack-store': {
      label: 'TanStack Store',
      hint: 'Framework-agnostic signals, bound to yours',
      only: (target) => {
        return target.stores?.includes('tanstack-store') === true;
      },
    },
    'pinia': {
      label: 'Pinia',
      hint: "Vue's own store",
      only: (target) => {
        return target.stores?.includes('pinia') === true;
      },
    },
    'ngrx-signals': {
      label: 'NgRx SignalStore',
      hint: 'Signal-based state, no reducers',
      only: (target) => {
        return target.stores?.includes('ngrx-signals') === true;
      },
    },
    'ngrx-store': {
      label: 'NgRx Store',
      hint: 'Actions, reducers and selectors',
      only: (target) => {
        return target.stores?.includes('ngrx-store') === true;
      },
    },
    'nanostores': {
      label: 'Nano Stores',
      hint: 'Atoms shared across islands',
      only: (target) => {
        return target.stores?.includes('nanostores') === true;
      },
    },
  },
} as const satisfies AnswerRecord;
