import routes from './routes';

describe('routes', () => {
  it('routes every page the starter ships, with home at the index and every other path last', () => {
    expect(routes).toHaveLength(4);

    const mapped = routes.map((entry) => {
      return entry.file;
    });
    const expected = [
      'routes/home/HomeRoute.tsx',
      'routes/about/AboutRoute.tsx',
      'routes/version/VersionRoute.tsx',
      'routes/not-found/NotFoundRoute.tsx',
    ];
    expect(mapped).toEqual(expected);
  });
});
