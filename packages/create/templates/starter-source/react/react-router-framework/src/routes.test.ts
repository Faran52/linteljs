import routes from './routes';

/*
 * The one thing worth pinning about a table of literals: that every page this starter ships is routed. React
 * Router reads this file at build time, so a page whose module is missing from it is a page nothing can reach,
 * and `ROUTES` would still render a header link to it.
 */
describe('routes', () => {
  it('routes every page the starter ships, with home at the index', () => {
    expect(routes).toHaveLength(3);
    expect(routes.map((entry) => {
      return entry.file;
    })).toEqual(['routes/home.tsx', 'routes/about.tsx', 'routes/version.tsx']);
  });
});
