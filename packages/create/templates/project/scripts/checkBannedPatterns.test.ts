import { spawnSync } from 'node:child_process';
import {
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execPath } from 'node:process';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { TEMPLATES_ROOT } from '../../../src/disk';

const CHECKER = join(TEMPLATES_ROOT, 'project/scripts/checkBannedPatterns.ts');

let cwd = '';

beforeEach(async () => {
  const prefix = join(tmpdir(), 'linteljs-banned-');
  cwd = await mkdtemp(prefix);
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

const run = (...paths: string[]): string => {
  const { status, stderr } = spawnSync(execPath, [CHECKER, ...paths], {
    cwd,
    encoding: 'utf8',
  });

  return status === 0 ? '' : stderr;
};

describe('the shipped checker', () => {
  it('fails on a banned pattern under the strict floor it ships with', async () => {
    await writeFile(join(cwd, 'sample.ts'), 'const value = input as never;\n', 'utf8');

    const report = run('sample.ts');

    expect(report).toContain('1: const value = input as never;  [as never]');
    expect(report).toContain('Fix the source');
  });

  it('passes a clean file', async () => {
    await writeFile(join(cwd, 'clean.ts'), 'export const clean = 1;\n', 'utf8');

    const actual = run('clean.ts');
    expect(actual).toBe('');
  });

  it('walks a directory for the extensions it ships with', async () => {
    await mkdir(join(cwd, 'src'));
    await writeFile(join(cwd, 'src/deep.tsx'), 'export const deep = input as never;\n', 'utf8');
    await writeFile(join(cwd, 'src/App.vue'), '<script setup lang="ts">\nconst a = b as never;\n</script>\n', 'utf8');

    const report = run('src');

    expect(report).toContain(join('src', 'deep.tsx'));
    expect(report).not.toContain('App.vue');
  });
});
