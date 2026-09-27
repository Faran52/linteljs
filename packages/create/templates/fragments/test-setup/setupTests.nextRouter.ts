// `next/navigation`'s hooks read a router only its runtime provides; `usePathname` alone is stood in.
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
