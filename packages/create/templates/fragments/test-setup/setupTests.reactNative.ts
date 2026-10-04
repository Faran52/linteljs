// Bare globals: the setup blocks joined below this one cannot import, and one file keeps one style.

// Reanimated reaches its native worklets at import, and so does the mock it ships; a view stands in.
jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');

  const reanimated = {
    __esModule: true,
    default: { View },
    cubicBezier: jest.fn(),
    useReducedMotion: jest.fn(() => {
      return false;
    }),
  };

  return reanimated;
});

// Node's `Request` refuses the relative fetch Expo resolves against its dev server at runtime.
const NodeRequest = globalThis.Request;

globalThis.Request = class extends NodeRequest {
  constructor(...[input, init]: ConstructorParameters<typeof Request>) {
    super(typeof input === 'string' && input.startsWith('/') ? new URL(input, 'http://localhost:8081') : input, init);
  }
};
