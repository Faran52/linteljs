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
