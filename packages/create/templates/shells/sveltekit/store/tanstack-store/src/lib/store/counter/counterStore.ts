import { Store, useSelector } from '@tanstack/svelte-store';

export interface CounterState {
  count: number;
}

export interface Counter {
  readonly count: number;
  add: () => void;
}

const store = new Store<CounterState>({ count: 0 });

// The count is a getter, so reading it in a template is what subscribes to it.
export const useCounter = (): Counter => {
  const selected = useSelector(store, (state) => {
    return state.count;
  });

  const counter = {
    get count() {
      return selected.current;
    },
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
