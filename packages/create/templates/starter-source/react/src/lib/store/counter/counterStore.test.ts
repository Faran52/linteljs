import { act, renderHook } from '@testing-library/react';

import { StoreProvider } from '../../providers/store/StoreProvider';

import { useCounter } from './counterStore';

describe('useCounter', () => {
  it('counts up, and every reader sees the same count', () => {
    const { result } = renderHook(() => {
      return {
        one: useCounter(),
        two: useCounter(),
      };
    }, { wrapper: StoreProvider });

    act(() => {
      result.current.one.add();
    });

    expect(result.current.one.count).toBe(1);
    expect(result.current.two.count).toBe(1);
  });
});
