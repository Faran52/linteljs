import { create } from 'zustand';

export interface Counter {
  count: number;
  add: () => void;
}

export const useCounter = create<Counter>((set) => {
  const counter = {
    count: 0,
    add: () => {
      set((state) => {
        const next = { count: state.count + 1 };

        return next;
      });
    },
  };

  return counter;
});
