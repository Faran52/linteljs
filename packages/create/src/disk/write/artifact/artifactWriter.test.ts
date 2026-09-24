import {
  mkdir,
  mkdtemp,
  readFile,
  readlink,
  rm,
  stat,
  symlink,
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

import { emitted, merged } from '#emitters/utils/artifactUtils';

import { artifactWriter } from './artifactWriter';

import type { Artifact } from '#emitters';

let cwd = '';
let external = '';

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'linteljs-artifact-'));
  external = await mkdtemp(join(tmpdir(), 'linteljs-artifact-external-'));
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
  await rm(external, {
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

  // A project being born is no licence to overwrite: `create` into a directory that exists, or `--existing --seed`,
  // once replaced a project's own CLAUDE.md and test setup with the shipped defaults.
  it('leaves an existing preserved artifact alone on a run that plants seeds too', async () => {
    await writeFile(join(cwd, 'kept.txt'), 'project\n', 'utf8');

    const artifact = {
      ...emitted('standard', 'kept.txt', 'shipped\n'),
      preserve: true,
    } satisfies Artifact;

    await expect(artifactWriter(cwd, artifact, true)).resolves.toBe(false);
    await expect(readFile(join(cwd, 'kept.txt'), 'utf8')).resolves.toBe('project\n');
  });

  // An adapter a project points elsewhere is still the project's, whether or not the link resolves.
  it('leaves a preserved artifact alone behind a live or a dangling symbolic link', async () => {
    const live = join(external, 'live.md');
    const dangling = join(external, 'dangling.md');

    await writeFile(live, 'external\n', 'utf8');
    await symlink(live, join(cwd, 'live.md'));
    await symlink(dangling, join(cwd, 'dangling.md'));

    for (const target of ['live.md', 'dangling.md']) {
      await expect(artifactWriter(cwd, {
        ...emitted('standard', target, 'shipped\n'),
        preserve: true,
      })).resolves.toBe(false);
    }

    await expect(readlink(join(cwd, 'live.md'))).resolves.toBe(live);
    await expect(readlink(join(cwd, 'dangling.md'))).resolves.toBe(dangling);
    await expect(readFile(live, 'utf8')).resolves.toBe('external\n');
    await expect(stat(dangling)).rejects.toThrow('ENOENT');
  });

  it('plants a seed artifact only on a run that plants seeds', async () => {
    const artifact = {
      ...emitted('standard', 'seed.txt', 'shipped\n'),
      seed: true,
    } satisfies Artifact;

    await expect(artifactWriter(cwd, artifact)).resolves.toBe(false);
    await expect(artifactWriter(cwd, artifact, true)).resolves.toBe(true);
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

  // A starter test covering source a scaffolder may not have written is skipped rather than left failing.
  it('writes an artifact that requires files only once every one of them is there', async () => {
    const artifact = {
      ...emitted('standard', 'src/App.test.tsx', 'shipped\n'),
      requires: ['src/App.tsx', 'src/main.tsx'],
    } satisfies Artifact;

    await mkdir(join(cwd, 'src'));
    await writeFile(join(cwd, 'src/App.tsx'), '', 'utf8');

    await expect(artifactWriter(cwd, artifact)).resolves.toBe(false);

    await writeFile(join(cwd, 'src/main.tsx'), '', 'utf8');

    await expect(artifactWriter(cwd, artifact)).resolves.toBe(true);
  });

  // The checker is copied and transformed, and its transform still needs the project's own blocks.
  it('gives a transformed artifact the current file', async () => {
    await writeFile(join(cwd, 'checker.ts'), 'current\n', 'utf8');

    const artifact = {
      stage: 'standard',
      target: 'checker.ts',
      content: {
        sources: ['project/lint-staged.config.js'],
        transform: (_source: string, current: string | null) => {
          return `${current ?? ''}transformed\n`;
        },
      },
    } satisfies Artifact;

    await expect(artifactWriter(cwd, artifact)).resolves.toBe(true);
    await expect(readFile(join(cwd, 'checker.ts'), 'utf8')).resolves.toBe('current\ntransformed\n');
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
