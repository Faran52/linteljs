import {
  describe,
  expect,
  it,
} from 'vitest';

import { quote } from './quoteUtils';

describe('quote', () => {
  it('single-quotes an ordinary value and escapes a quote', () => {
    const quoted = quote('src/**');
    expect(quoted).toBe("'src/**'");
    const itSQuoted = quote("it's");
    expect(itSQuoted).toBe("'it\\'s'");
  });

  it('keeps a backslash literal through String.raw', () => {
    const quoted = quote('a\\[b]');
    expect(quoted).toBe('String.raw`a\\[b]`');
  });

  it('escapes a trailing backslash instead of ending the template early', () => {
    const quoted = quote('build\\');

    expect(quoted).toBe("'build\\\\'");
  });

  it('escapes a backslash next to a backtick or an interpolation', () => {
    const withBacktick = quote('a\\`b');
    const withInterpolation = quote('a\\${b}');

    expect(withBacktick).toBe("'a\\\\`b'");
    expect(withInterpolation).toBe("'a\\\\${b}'");
  });

  it('escapes a newline and a carriage return', () => {
    const quoted = quote('a\nb\rc');

    expect(quoted).toBe("'a\\nb\\rc'");
  });
});
