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

/*
 * Expo resolves a relative fetch against the dev server's origin at runtime, and Node's `Request` refuses one, so
 * `fetchBaseQuery({ baseUrl: '/api' })` threw before its fetch was ever called. The suite does what the runtime does.
 */
const NodeRequest = globalThis.Request;

globalThis.Request = class extends NodeRequest {
  constructor(...[input, init]: ConstructorParameters<typeof Request>) {
    super(typeof input === 'string' && input.startsWith('/') ? new URL(input, 'http://localhost:8081') : input, init);
  }
};
