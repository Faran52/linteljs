import { create } from 'zustand';

export interface Counter {
  count: number;
  add: () => void;
}

/*
 * The one store this starter ships, and the one place the store answer is visible. Every other file takes
 * `useCounter` and never knows which library is behind it, which is what lets the answer change without the pages
 * changing with it.
 */
export const useCounter = create<Counter>((set) => {
  return {
    count: 0,
    add: () => {
      set((state) => {
        return { count: state.count + 1 };
      });
    },
  };
});
