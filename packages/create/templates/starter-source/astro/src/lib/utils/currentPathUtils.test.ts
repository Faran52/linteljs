import { isCurrentPath } from './currentPathUtils';

describe('isCurrentPath', () => {
  it('marks the page being looked at', () => {
    expect(isCurrentPath('/about', '/about')).toBe(true);
    expect(isCurrentPath('/about', '/version')).toBe(false);
  });

  it('reads a trailing slash as the same page', () => {
    expect(isCurrentPath('/about/', '/about')).toBe(true);
  });

  it('leaves the root alone', () => {
    expect(isCurrentPath('/', '/')).toBe(true);
  });
});
