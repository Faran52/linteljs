import routes from './routes';

describe('routes', () => {
  it('routes every page the starter ships, with home at the index', () => {
    expect(routes).toHaveLength(3);
    expect(routes.map((entry) => {
      return entry.file;
    })).toEqual(['routes/home.tsx', 'routes/about.tsx', 'routes/version.tsx']);
  });
});
