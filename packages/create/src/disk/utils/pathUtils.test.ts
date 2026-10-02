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
    const actual = await safeProjectPath(cwd, 'src/main.tsx');
    expect(actual).toBe(join(cwd, 'src', 'main.tsx'));
  });

  it('resolves a target at the root of a project that is itself a symbolic link', async () => {
    await mkdir(join(cwd, 'real'));
    await symlink(join(cwd, 'real'), join(cwd, 'linked'));

    const actual = await safeProjectPath(join(cwd, 'linked'), 'package.json');
    expect(actual).toBe(join(cwd, 'linked', 'package.json'));
  });

  it('refuses an absolute target', async () => {
    const promise = safeProjectPath(cwd, join(cwd, 'src/main.tsx'));
    await expect(promise).rejects.toThrow('must be a relative path');
  });

  it('refuses a target that climbs out of the project', async () => {
    const promise = safeProjectPath(cwd, '../x');
    await expect(promise).rejects.toThrow('must be a relative path');
    const cwdPromise = safeProjectPath(cwd, '..');
    await expect(cwdPromise).rejects.toThrow('must be a relative path');
  });

  it.each(['', '.'])('refuses %j, which names the project root', async (target) => {
    const promise = safeProjectPath(cwd, target);
    await expect(promise).rejects.toThrow('must be a relative path');
  });

  it('refuses a target reached through a symbolic link', async () => {
    await mkdir(join(cwd, 'real'));
    await symlink(join(cwd, 'real'), join(cwd, 'linked'));

    const promise = safeProjectPath(cwd, 'linked/a.txt');
    await expect(promise).rejects.toThrow('symbolic link');
  });
});
