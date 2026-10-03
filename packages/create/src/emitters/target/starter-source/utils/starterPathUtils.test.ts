import { relativeSpecifier, stem } from './starterPathUtils';

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

describe('relativeSpecifier', () => {
  it('dots a neighbour in the same directory', () => {
    const actual = relativeSpecifier('src/lib/utils', 'src/lib/utils/status-utils');
    expect(actual).toBe('./status-utils');
  });

  it('leaves a path that already climbs out as it is', () => {
    const actual = relativeSpecifier('src/lib/utils', 'src/config/routes');
    expect(actual).toBe('../../config/routes');
  });
});
