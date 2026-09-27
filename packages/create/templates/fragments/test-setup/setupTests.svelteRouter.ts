// SvelteKit's runtime fills `$app/state` on navigation; a rendered component otherwise reads an empty page.
export const ORIGIN = 'http://localhost';

export const pageMock = { url: new URL(`${ORIGIN}/`) };

vi.mock('$app/state', () => {
  return { page: pageMock };
});

beforeEach(() => {
  pageMock.url = new URL(`${ORIGIN}/`);
});
