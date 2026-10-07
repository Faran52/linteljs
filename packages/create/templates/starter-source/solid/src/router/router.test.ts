import { ROUTES } from './router';

describe('ROUTES', () => {
  it('opens on the home page', () => {
    const [first] = ROUTES;

    expect(first.path).toBe('/');
  });

  it('gives every page its own path', () => {
    const paths = new Set(ROUTES
      .map(({ path }) => {
        return path;
      }));

    expect(paths.size).toBe(ROUTES.length);
  });
});
