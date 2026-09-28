import { create } from 'zustand';

export interface Counter {
  count: number;
  add: () => void;
}

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
