import routes from './routes';

describe('routes', () => {
  it('routes every page the starter ships, with home at the index', () => {
    expect(routes).toHaveLength(3);

    const mapped = routes.map((entry) => {
      return entry.file;
    });
    const expected = [
      'routes/home.tsx',
      'routes/about.tsx',
      'routes/version.tsx',
    ];
    expect(mapped).toEqual(expected);
  });
});
