import { Store, useSelector } from '@tanstack/svelte-store';

export interface CounterState {
  count: number;
}

export interface Counter {
  readonly count: number;
  add: () => void;
}

const store = new Store<CounterState>({ count: 0 });

/*
 * The one store this starter ships, and the one place the store answer is visible. Every other file takes
 * `useCounter` and never knows which library is behind it.
 *
 * Runes cover state inside a component; this is for what crosses one, which is why the target offers a library
 * here rather than the built-in. The count is a getter, so reading it in a template is what subscribes to it.
 */
export const useCounter = (): Counter => {
  const selected = useSelector(store, (state) => {
    return state.count;
  });

  return {
    get count() {
      return selected.current;
    },
    add: () => {
      store
        .setState((state) => {
          return { count: state.count + 1 };
        });
    },
  };
};
