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

/*
 * The one store this starter ships, and the one place the store answer is visible. Every other file takes
 * `useCounter` and never knows which library is behind it.
 *
 * Solid's own `createStore` covers state inside a component; this is for what crosses one, which is why the
 * target offers a library here rather than the built-in.
 */
export const useCounter = (): Counter => {
  const count = useSelector(store, (state) => {
    return state.count;
  });

  return {
    count,
    add: () => {
      store.setState((state) => {
        return { count: state.count + 1 };
      });
    },
  };
};
