import {
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
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

import { emitted, merged } from '../../../emitters/utils/artifactUtils';

import { artifactWriter } from './artifactWriter';

import type { Artifact } from '../../../emitters';

let cwd = '';

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'linteljs-artifact-'));
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

describe('artifactWriter', () => {
  it('leaves an existing preserved artifact alone and reports no write', async () => {
    await writeFile(join(cwd, 'kept.txt'), 'project\n', 'utf8');

    const artifact = {
      ...emitted('standard', 'kept.txt', 'shipped\n'),
      preserve: true,
    } satisfies Artifact;

    await expect(artifactWriter(cwd, artifact)).resolves.toBe(false);
    await expect(readFile(join(cwd, 'kept.txt'), 'utf8')).resolves.toBe('project\n');
  });

  it('gives a merged artifact the current file and reports its write', async () => {
    await writeFile(join(cwd, 'settings.json'), 'current\n', 'utf8');

    const artifact = merged('standard', 'settings.json', (current) => {
      return `${current ?? ''}merged\n`;
    });

    await expect(artifactWriter(cwd, artifact)).resolves.toBe(true);
    await expect(readFile(join(cwd, 'settings.json'), 'utf8'))
      .resolves.toBe('current\nmerged\n');
  });

  it('makes an executable artifact executable', async () => {
    const artifact = {
      ...emitted('standard', 'hook.sh', '#!/bin/sh\n'),
      executable: true,
    } satisfies Artifact;

    await expect(artifactWriter(cwd, artifact)).resolves.toBe(true);
    expect((await stat(join(cwd, 'hook.sh'))).mode & 0o111).toBe(0o111);
  });
});
