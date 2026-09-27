import { Store, useSelector } from '@tanstack/vue-store';

import type { Ref } from 'vue';

export interface CounterState {
  count: number;
}

export interface Counter {
  count: Readonly<Ref<number>>;
  add: () => void;
}

const store = new Store<CounterState>({ count: 0 });

/*
 * The one store this starter ships, and the one place the store answer is visible. Every other file takes
 * `useCounter` and never knows which library is behind it.
 */
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
