import {
  describe,
  expect,
  it,
} from 'vitest';

import { nodeVersionRefusal } from './nodeUtils';

describe('nodeVersionRefusal', () => {
  it('says nothing on the declared floor, or above it', () => {
    expect(nodeVersionRefusal('26.8.2')).toBeUndefined();
    expect(nodeVersionRefusal('26.9.0')).toBeUndefined();
    expect(nodeVersionRefusal('27.0.0')).toBeUndefined();
  });

  it('names both versions and where to get one', () => {
    const refusal = nodeVersionRefusal('24.11.0') ?? '';

    expect(refusal).toContain('Node 24.11.0 is running this');
    expect(refusal).toContain('needs Node 26.8.2 or newer');
    expect(refusal).toContain('https://nodejs.org');
  });

  /**
   * The case that separates this from the package manager check beside it, which compares majors alone on purpose.
   * A floor of `>=26.8.2` has to refuse 26.8.1, and a major comparison would wave it through.
   */
  it('compares the minor and the patch, not the major alone', () => {
    expect(nodeVersionRefusal('26.8.1')).toBeDefined();
    expect(nodeVersionRefusal('26.7.99')).toBeDefined();
    expect(nodeVersionRefusal('26.8.3')).toBeUndefined();
  });
});
