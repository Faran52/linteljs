import {
  describe,
  expect,
  it,
} from 'vitest';

import { resolvedBinary } from './binaryUtils';

describe('resolvedBinary', () => {
  // The Node running this suite is on PATH by definition, so this is the one name always resolvable here.
  it('answers an absolute path to a binary that is on PATH', () => {
    const resolved = resolvedBinary('node') ?? '';

    expect(resolved).toMatch(/node$/u);
    expect(resolved.startsWith('/')).toBe(true);
  });

  it('answers nothing for a name PATH does not carry', () => {
    expect(resolvedBinary('linteljs-no-such-binary')).toBeUndefined();
  });
});
