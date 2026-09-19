/**
 * Router mocks, for whichever of these bindings the project installed; the others cost nothing, since a factory runs
 * only when something imports the module it stands in for. Only `useNavigate` is stood in, so navigation can be
 * asserted with no router mounted, and every other export stays real: wrap the component in the binding's own
 * `MemoryRouter` when it reads the route.
 */

// Exported for assertions: `expect(navigateMock).toHaveBeenCalledWith('/somewhere')`.
export const navigateMock = vi.fn();

// `vi.fn`, not a bare arrow: a stand-in hook calls no hooks, which no-unnecessary-use-prefix reads as a misnamed
// helper; a mock function is what this is, and the rule leaves it be.
const navigation = {
  useNavigate: vi.fn(() => {
    return navigateMock;
  }),
};

// `Object.assign`, not a spread: `importOriginal()` answers `unknown` untyped, and this file also ships as `.js`.
vi.mock('react-router', async (importOriginal) => {
  return Object.assign({}, await importOriginal(), navigation);
});

vi.mock('@tanstack/react-router', async (importOriginal) => {
  return Object.assign({}, await importOriginal(), navigation);
});

vi.mock('@tanstack/solid-router', async (importOriginal) => {
  return Object.assign({}, await importOriginal(), navigation);
});

beforeEach(() => {
  navigateMock.mockClear();
});
