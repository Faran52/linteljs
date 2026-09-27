import { Store, useSelector } from '@tanstack/solid-store';

import type { Accessor } from 'solid-js';

export interface CounterState {
  count: number;
}

export interface Counter {
  count: Accessor<number>;
  add: () => void;
}

const store = new Store<CounterState>({ count: 0 });

// Solid's `createStore` covers state inside a component; this is for what crosses one.
export const useCounter = (): Counter => {
  const count = useSelector(store, (state) => {
    return state.count;
  });

  return {
    count,
    add: () => {
      store
        .setState((state) => {
          return { count: state.count + 1 };
        });
    },
  };
};
