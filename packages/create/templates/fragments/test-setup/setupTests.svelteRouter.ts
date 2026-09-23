/**
 * SvelteKit's `$app/state` is filled in by its own runtime on navigation, so a component a suite renders rather
 * than the router reads an empty page and `page.url` is undefined. This stands that one property in, at the route
 * a suite starts on.
 *
 * Exported for a suite that renders a page the header should mark: `pageMock.url = new URL(ORIGIN + '/about')`.
 */
export const ORIGIN = 'http://localhost';

export const pageMock = { url: new URL(`${ORIGIN}/`) };

vi.mock('$app/state', () => {
  return { page: pageMock };
});

beforeEach(() => {
  pageMock.url = new URL(`${ORIGIN}/`);
});
