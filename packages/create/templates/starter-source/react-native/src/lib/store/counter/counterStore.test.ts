import { act, renderHook } from '@testing-library/react-native';

import { StoreProvider } from '@lib/providers/store/StoreProvider';

import { useCounter } from './counterStore';

describe('useCounter', () => {
  it('counts up, and every reader sees the same count', async () => {
    const { result } = await renderHook(() => {
      const readers = {
        one: useCounter(),
        two: useCounter(),
      };

      return readers;
    }, { wrapper: StoreProvider });

    await act(() => {
      result.current.one.add();
    });

    expect(result.current.one.count).toBe(1);
    expect(result.current.two.count).toBe(1);
  });
});
