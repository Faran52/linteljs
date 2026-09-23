import { isCurrentPath } from './currentPath';

describe('isCurrentPath', () => {
  it('marks the page being looked at', () => {
    expect(isCurrentPath('/about', '/about')).toBe(true);
    expect(isCurrentPath('/about', '/version')).toBe(false);
  });

  // Astro serves both spellings as the same page, so a header comparing the strings would mark neither.
  it('reads a trailing slash as the same page', () => {
    expect(isCurrentPath('/about/', '/about')).toBe(true);
  });

  // The root is the one path that is a slash, so trimming it would leave nothing to compare.
  it('leaves the root alone', () => {
    expect(isCurrentPath('/', '/')).toBe(true);
  });
});
