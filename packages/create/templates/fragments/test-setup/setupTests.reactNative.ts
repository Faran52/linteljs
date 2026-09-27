// Bare globals: the fragments appended below cannot import, and one file does not mix styles.

// `expo-router`'s navigators reach for a native screen container at import; a view stands in.
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

// Node's `Request` refuses the relative fetch Expo resolves against its dev server at runtime.
const NodeRequest = globalThis.Request;

globalThis.Request = class extends NodeRequest {
  constructor(...[input, init]: ConstructorParameters<typeof Request>) {
    super(typeof input === 'string' && input.startsWith('/') ? new URL(input, 'http://localhost:8081') : input, init);
  }
};
