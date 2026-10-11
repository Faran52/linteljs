import { Store, useSelector } from '@tanstack/react-store';

export interface CounterState {
  count: number;
}

export interface Counter {
  count: number;
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
