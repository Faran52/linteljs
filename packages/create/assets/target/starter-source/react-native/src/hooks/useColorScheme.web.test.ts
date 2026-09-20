import { renderHook } from '@testing-library/react-native';

import { useColorScheme } from './useColorScheme.web';

const { store } = vi.hoisted(() => {
  return { store: { server: false } };
});

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');

  return {
    ...actual,
    useSyncExternalStore: (
      subscribe: (onChange: () => void) => () => void,
      getSnapshot: () => boolean,
      getServerSnapshot: () => boolean,
    ) => {
      const unsubscribe = subscribe(() => {
        return undefined;
      });

      unsubscribe();

      return store.server ? getServerSnapshot() : getSnapshot();
    },
  };
});

describe('useColorScheme (web)', () => {
  it('reports the system scheme once the client has hydrated', async () => {
    store.server = false;

    const { result } = await renderHook(() => {
      return useColorScheme();
    });

    expect(result.current).toBeDefined();
  });

  it('reports light while the server snapshot is the one in play', async () => {
    store.server = true;

    const { result } = await renderHook(() => {
      return useColorScheme();
    });

    expect(result.current).toBe('light');
  });
});
