import { importSpecifier, stem } from './starterPathUtils';

describe('stem', () => {
  it.each([
    ['src/App.tsx', 'src/App'],
    ['src/lib/utils/statusUtils.ts', 'src/lib/utils/statusUtils'],
    ['postcss.config.mjs', 'postcss.config'],
    ['scripts/build.cts', 'scripts/build'],
  ])('drops the code extension of %s', (path, expected) => {
    const actual = stem(path);
    expect(actual).toBe(expected);
  });

  it.each([
    'src/data.json',
    'src/styles.css',
  ])('keeps %s whole, since it is not code', (path) => {
    const actual = stem(path);
    expect(actual).toBe(path);
  });
});

describe('importSpecifier', () => {
  const aliases = {
    '@views/*': './src/views/*',
    '@lib/*': './src/lib/*',
    '@apis/*': './src/lib/apis/*',
    '@lib': './src/lib',
    '@mocks/*': './__mocks__/*',
  };

  it('dots a neighbour in the same directory', () => {
    const actual = importSpecifier('src/lib/utils', 'src/lib/utils/status-utils', aliases);
    expect(actual).toBe('./status-utils');
  });

  it('climbs out where no alias covers the target', () => {
    const actual = importSpecifier('src/lib/utils', 'src/config/routes', aliases);
    expect(actual).toBe('../../config/routes');
  });

  it('stays relative inside the aliased directory it shares with the target', () => {
    const actual = importSpecifier('src/views/contact', 'src/views/home/HomeView', aliases);
    expect(actual).toBe('../home/HomeView');
  });

  it('crosses into an aliased directory through its alias', () => {
    const actual = importSpecifier('__mocks__', 'src/views/contact/use-contact-form/useContactForm', aliases);
    expect(actual).toBe('@views/contact/use-contact-form/useContactForm');
  });

  it('takes the deepest alias over the target', () => {
    const actual = importSpecifier('src/views/contact', 'src/lib/apis/contact/contactApi', aliases);
    expect(actual).toBe('@apis/contact/contactApi');
  });

  it('stays relative from the root of the deepest alias over the target', () => {
    const actual = importSpecifier('src/lib/apis', 'src/lib/apis/contact/contactApi', aliases);
    expect(actual).toBe('./contact/contactApi');
  });
});
