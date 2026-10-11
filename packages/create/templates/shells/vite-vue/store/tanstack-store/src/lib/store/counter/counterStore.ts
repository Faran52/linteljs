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

export const useCounter = (): Counter => {
  const count = useSelector(store, (state) => {
    return state.count;
  });

  const counter = {
    count,
    add: () => {
      store
        .setState((state) => {
          const next = { count: state.count + 1 };

          return next;
        });
    },
  };

  return counter;
};
