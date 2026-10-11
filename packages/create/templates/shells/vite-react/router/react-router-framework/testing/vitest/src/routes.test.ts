import routes from './routes';

describe('routes', () => {
  it('routes every page the starter ships, with home at the index and every other path last', () => {
    const files = routes.map((entry) => {
      return entry.file;
    });

    const expected = [
      'routes/home/HomeRoute.tsx',
      'routes/contact/ContactRoute.tsx',
      'routes/about/AboutRoute.tsx',
      'routes/version/VersionRoute.tsx',
      'routes/not-found/NotFoundRoute.tsx',
    ];
    expect(files).toEqual(expected);
  });
});
