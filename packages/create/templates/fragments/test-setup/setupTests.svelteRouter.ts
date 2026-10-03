// SvelteKit's runtime fills `$app/state` on navigation; a rendered component otherwise reads an empty page.
export const ORIGIN = 'http://localhost';

const data: App.PageData = {};

export const pageMock = {
  url: new URL(`${ORIGIN}/`),
  data,
};

vi.mock('$app/state', () => {
  const appState = { page: pageMock };

  return appState;
});

beforeEach(() => {
  pageMock.url = new URL(`${ORIGIN}/`);
  pageMock.data = {};
});
