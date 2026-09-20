// Global test setup, wired from `vitest.config.ts`. Each mock stands in for a native module that never runs here. Bare
// globals, not an import from `vitest`: the fragments appended below cannot import, and one file does not mix styles.

vi.mock('expo-device', () => {
  return { isDevice: true, deviceName: 'Test Device' };
});

vi.mock('expo-image', async () => {
  const { Image } = await vi.importActual<typeof import('react-native')>('react-native');

  return { Image };
});

vi.mock('expo-symbols', async () => {
  const { View } = await vi.importActual<typeof import('react-native')>('react-native');

  return { SymbolView: View };
});

vi.mock('expo-splash-screen', () => {
  return {
    // Spies, not stubs: a test asserts the splash screen was actually asked to hide.
    preventAutoHideAsync: vi.fn(() => Promise.resolve()),
    hideAsync: vi.fn(() => Promise.resolve()),
  };
});

// Reanimated reaches for the worklets native module at import; `createSerializable` is what its path needs.
vi.mock('react-native-worklets', () => {
  return {
    scheduleOnRN: (callback: (...args: unknown[]) => unknown, ...args: unknown[]) => {
      return callback(...args);
    },
    createSerializable: (value: unknown) => {
      return value;
    },
  };
});

vi.mock('react-native-reanimated', async () => {
  const { View } = await vi.importActual<typeof import('react-native')>('react-native');

  // `withCallback` runs its callback immediately: no animation finishes here, so that path is otherwise dead.
  class Keyframe {
    duration = (): this => {
      return this;
    };

    withCallback = (onFinished: (finished: boolean) => void): this => {
      // Both outcomes: an interrupted animation reports false, and that branch is otherwise never run.
      onFinished(false);
      onFinished(true);

      return this;
    };
  }

  return {
    default: { View },
    Easing: {
      elastic: () => {
        return 0;
      },
    },
    Keyframe,
    FadeIn: {
      duration: () => {
        return {};
      },
    },
  };
});
