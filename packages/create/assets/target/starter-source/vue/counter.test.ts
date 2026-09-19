import { createPinia, setActivePinia } from 'pinia';

import { useCounterStore } from './counter';

describe('useCounterStore', () => {
  it('doubles what it counts', () => {
    setActivePinia(createPinia());

    const store = useCounterStore();

    expect(store.count).toBe(0);

    store.increment();

    expect(store.count).toBe(1);
    expect(store.doubleCount).toBe(2);
  });
});
