// Global test setup, wired from `vitest.config.ts`. Each mock stands in for a native module that never runs here. Bare
// globals, not an import from `vitest`: the fragments appended below cannot import, and one file does not mix styles.

/*
 * `expo-router`'s navigators reach for the native screen container at import, and there is none in a test renderer.
 * A view stands in, which is what the container is once the platform is taken away.
 */
vi.mock('react-native-screens', async () => {
  const actual = await vi.importActual<typeof import('react-native-screens')>('react-native-screens');
  const { View } = await vi.importActual<typeof import('react-native')>('react-native');

  return {
    ...actual,
    Screen: View,
    ScreenContainer: View,
    enableScreens: vi.fn(),
  };
});
