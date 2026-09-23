import { ref } from 'vue';
import { defineStore } from 'pinia';

/*
 * The one store this starter ships, and the one place the store answer is visible. Every other file takes
 * `useCounter` and never knows which library is behind it, which is what lets the answer change without the views
 * changing with it.
 */
export const useCounter = defineStore('counter', () => {
  const count = ref(0);
  const add = (): void => {
    count.value += 1;
  };

  return {
    count,
    add,
  };
});
