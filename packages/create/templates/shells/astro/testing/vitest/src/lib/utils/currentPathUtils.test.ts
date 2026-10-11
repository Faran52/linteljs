import { isCurrentPath } from './currentPathUtils';

describe('isCurrentPath', () => {
  it('marks the page being looked at', () => {
    const aboutIsCurrentPath = isCurrentPath('/about', '/about');
    expect(aboutIsCurrentPath).toBe(true);
    const aboutIsCurrentPath2 = isCurrentPath('/about', '/version');
    expect(aboutIsCurrentPath2).toBe(false);
  });

  it('reads a trailing slash as the same page', () => {
    const aboutIsCurrentPath = isCurrentPath('/about/', '/about');
    expect(aboutIsCurrentPath).toBe(true);
  });

  it('leaves the root alone', () => {
    const actual = isCurrentPath('/', '/');
    expect(actual).toBe(true);
  });
});
