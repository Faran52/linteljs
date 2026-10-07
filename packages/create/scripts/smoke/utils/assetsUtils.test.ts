import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { assertPacked, filesIn } from './assetsUtils.ts';

const TEST_FILE = 'project/scripts/utils/loggerUtils.test.ts';
const MOD_TYPES = 'project/plugins/linteljs/.claude-plugin/types/engine.d.ts';
const ASSET = 'project/scripts/utils/loggerUtils.ts';

describe('filesIn', () => {
  let dir: string;

  beforeEach(() => {
    const prefix = join(tmpdir(), 'linteljs-smoke-');

    dir = mkdtempSync(prefix);
  });

  afterEach(() => {
    rmSync(dir, {
      recursive: true,
      force: true,
    });
  });

  it('lists every file below the directory relative to it, dotfiles included and directories left out', () => {
    mkdirSync(join(dir, 'a', 'b'), { recursive: true });
    writeFileSync(join(dir, '.npmrc'), '');
    writeFileSync(join(dir, 'a', 'b', 'c.ts'), '');

    const files = filesIn(dir)
      .toSorted((left, right) => {
        return left.localeCompare(right, 'en');
      });

    expect(files).toEqual(['.npmrc', 'a/b/c.ts']);
  });
});

describe('assertPacked', () => {
  it('passes when every asset is packed and every excluded file is left out', () => {
    expect(() => {
      assertPacked([
        ASSET,
        TEST_FILE,
        MOD_TYPES,
      ], [ASSET]);
    }).not.toThrow();
  });

  it('fails on a packed suite', () => {
    expect(() => {
      assertPacked([ASSET, TEST_FILE], [ASSET, TEST_FILE]);
    }).toThrow(`excluded by \`files\` but packed:\n  ${TEST_FILE}`);
  });

  it('fails on packed mod types', () => {
    expect(() => {
      assertPacked([MOD_TYPES], [MOD_TYPES]);
    }).toThrow(`excluded by \`files\` but packed:\n  ${MOD_TYPES}`);
  });

  it('fails on an asset left out of the tarball', () => {
    expect(() => {
      assertPacked([ASSET], []);
    }).toThrow(`assets in the repo that \`files\` did not pack:\n  ${ASSET}`);
  });

  it('holds a suite outside scripts and plugins to be shipped', () => {
    const fixture = 'project/src/app.test.ts';

    expect(() => {
      assertPacked([fixture], []);
    }).toThrow(`did not pack:\n  ${fixture}`);
  });
});
