import routes from './routes';

describe('routes', () => {
  it('routes every page the starter ships, with home at the index', () => {
    const files = routes.map((entry) => {
      return entry.file;
    });

    expect(files).toEqual(['routes/home.tsx', 'routes/contact.tsx', 'routes/about.tsx', 'routes/version.tsx']);
  });
});
