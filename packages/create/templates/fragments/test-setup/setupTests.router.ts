// A factory runs only when its module is imported, so the uninstalled bindings cost nothing.

export const navigateMock = vi.fn();

// `vi.fn`: a bare arrow calling no hooks reads to no-unnecessary-use-prefix as a misnamed helper.
const navigation = {
  useNavigate: vi.fn(() => {
    return navigateMock;
  }),
};

// `Object.assign`, not a spread: `importOriginal()` answers `unknown` untyped, and this file also ships as `.js`.
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal();

  return Object.assign({}, actual, navigation);
});

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal();

  return Object.assign({}, actual, navigation);
});

vi.mock('@tanstack/solid-router', async (importOriginal) => {
  const actual = await importOriginal();

  return Object.assign({}, actual, navigation);
});

beforeEach(() => {
  navigateMock.mockClear();
});
