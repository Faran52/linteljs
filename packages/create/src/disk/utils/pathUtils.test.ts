import {
  mkdir,
  mkdtemp,
  rm,
  symlink,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { safeProjectPath } from './pathUtils';

let cwd = '';

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'linteljs-path-'));
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

describe('safeProjectPath', () => {
  it('resolves a relative target against the project root', async () => {
    await expect(safeProjectPath(cwd, 'src/main.tsx')).resolves.toBe(join(cwd, 'src', 'main.tsx'));
  });

  // An absolute target is refused rather than resolved, even where it happens to land inside the project.
  it('refuses an absolute target', async () => {
    await expect(safeProjectPath(cwd, join(cwd, 'src/main.tsx'))).rejects.toThrow('must be a relative path');
  });

  it('refuses a target that climbs out of the project', async () => {
    await expect(safeProjectPath(cwd, '../x')).rejects.toThrow('must be a relative path');
  });

  // Refused rather than followed: a scaffolder leaving a link behind would otherwise write outside the project.
  it('refuses a target reached through a symbolic link', async () => {
    await mkdir(join(cwd, 'real'));
    await symlink(join(cwd, 'real'), join(cwd, 'linked'));

    await expect(safeProjectPath(cwd, 'linked/a.txt')).rejects.toThrow('symbolic link');
  });
});
