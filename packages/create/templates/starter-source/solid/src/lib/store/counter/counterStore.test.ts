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

    const actual = result.one.count();
    expect(actual).toBe(1);
    const actual2 = result.two.count();
    expect(actual2).toBe(1);
  });
});
