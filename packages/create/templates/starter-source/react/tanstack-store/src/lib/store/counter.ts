import { Store, useSelector } from '@tanstack/react-store';

export interface CounterState {
  count: number;
}

export interface Counter {
  count: number;
  add: () => void;
}

const store = new Store<CounterState>({ count: 0 });

/*
 * The one store this starter ships, and the one place the store answer is visible. Every other file takes
 * `useCounter` and never knows which library is behind it, which is what lets the answer change without the pages
 * changing with it.
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
