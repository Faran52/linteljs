import { renderHook } from '@solidjs/testing-library';

import { StoreProvider } from '@lib/providers/store/StoreProvider';

import { useCounter } from './counterStore';

describe('useCounter', () => {
  it('counts up, and every reader sees the same count', () => {
    const { result } = renderHook(() => {
      return {
        one: useCounter(),
        two: useCounter(),
      };
    }, { wrapper: StoreProvider });

    result.one.add();

    expect(result.one.count()).toBe(1);
    expect(result.two.count()).toBe(1);
  });
});
