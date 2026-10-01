import { ref } from 'vue';
import { defineStore } from 'pinia';

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
