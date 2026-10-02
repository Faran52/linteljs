import {
  describe,
  expect,
  it,
} from 'vitest';

import { UPSTREAM } from './constants';
import { verdaccioConfig } from './registry';

describe('verdaccioConfig', () => {
  it('proxies to npmjs unless told otherwise', () => {
    const actual = verdaccioConfig('/storage');
    expect(actual).toContain(`  npmjs:\n    url: ${UPSTREAM}\n`);
  });

  it('proxies to the upstream E2E_UPSTREAM names', () => {
    const config = verdaccioConfig('/storage', 'https://mirror.example/');

    expect(config).toContain('  npmjs:\n    url: https://mirror.example/\n');
    expect(config).not.toContain(UPSTREAM);
  });
});
