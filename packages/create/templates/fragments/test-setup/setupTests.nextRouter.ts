/**
 * `next/navigation`'s hooks read a router its own runtime provides, so a component a suite renders rather than the
 * App Router reads nothing and throws. `usePathname` is the one the starter's header calls, and it is the only one
 * stood in for: everything else stays real.
 *
 * Exported for a suite that renders a page the header should mark: `pathnameMock.mockReturnValue('/about')`.
 */
export const pathnameMock = vi.fn(() => {
  return '/';
});

// `Object.assign`, not a spread: `importOriginal()` answers `unknown` untyped, and this file also ships as `.js`.
vi.mock('next/navigation', async (importOriginal) => {
  return Object.assign({}, await importOriginal(), { usePathname: pathnameMock });
});

beforeEach(() => {
  pathnameMock.mockReturnValue('/');
});
