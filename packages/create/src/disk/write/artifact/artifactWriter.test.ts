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

import { emitted, merged } from '@emitters/utils/artifactUtils';

import { artifactWriter } from './artifactWriter';

import type { Artifact } from '@emitters';

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

    const cwdArtifact = await artifactWriter(cwd, artifact);
    expect(cwdArtifact).toBe(false);
    const file = await readFile(join(cwd, 'kept.txt'), 'utf8');
    expect(file).toBe('project\n');
  });

  it('leaves an existing preserved artifact alone on a run that plants seeds too', async () => {
    await writeFile(join(cwd, 'kept.txt'), 'project\n', 'utf8');

    const artifact = {
      ...emitted('standard', 'kept.txt', 'shipped\n'),
      preserve: true,
    } satisfies Artifact;

    const cwdArtifact = await artifactWriter(cwd, artifact, true);
    expect(cwdArtifact).toBe(false);
    const file = await readFile(join(cwd, 'kept.txt'), 'utf8');
    expect(file).toBe('project\n');
  });

  it('leaves a preserved artifact alone behind a live or a dangling symbolic link', async () => {
    const live = join(external, 'live.md');
    const dangling = join(external, 'dangling.md');

    await writeFile(live, 'external\n', 'utf8');
    await symlink(live, join(cwd, 'live.md'));
    await symlink(dangling, join(cwd, 'dangling.md'));

    for (const target of ['live.md', 'dangling.md']) {
      const written = artifactWriter(cwd, {
        ...emitted('standard', target, 'shipped\n'),
        preserve: true,
      });

      await expect(written).resolves.toBe(false);
    }

    const actual = await readlink(join(cwd, 'live.md'));
    expect(actual).toBe(live);
    const actual2 = await readlink(join(cwd, 'dangling.md'));
    expect(actual2).toBe(dangling);
    const file = await readFile(live, 'utf8');
    expect(file).toBe('external\n');
    const promise = stat(dangling);
    await expect(promise).rejects.toThrow('ENOENT');
  });

  it('plants a seed artifact only on a run that plants seeds', async () => {
    const artifact = {
      ...emitted('standard', 'seed.txt', 'shipped\n'),
      seed: true,
    } satisfies Artifact;

    const cwdArtifact = await artifactWriter(cwd, artifact);
    expect(cwdArtifact).toBe(false);
    const artifact2 = await artifactWriter(cwd, artifact, true);
    expect(artifact2).toBe(true);
  });

  it('gives a merged artifact the current file and reports its write', async () => {
    await writeFile(join(cwd, 'settings.json'), 'current\n', 'utf8');

    const artifact = merged('standard', 'settings.json', (current) => {
      return `${current ?? ''}merged\n`;
    });

    const cwdArtifact = await artifactWriter(cwd, artifact);
    expect(cwdArtifact).toBe(true);

    const file = await readFile(join(cwd, 'settings.json'), 'utf8');
    expect(file).toBe('current\nmerged\n');
  });

  it('writes an artifact that requires files only once every one of them is there', async () => {
    const artifact = {
      ...emitted('standard', 'src/App.test.tsx', 'shipped\n'),
      requires: ['src/App.tsx', 'src/main.tsx'],
    } satisfies Artifact;

    await mkdir(join(cwd, 'src'));
    await writeFile(join(cwd, 'src/App.tsx'), '', 'utf8');

    const cwdArtifact = await artifactWriter(cwd, artifact);
    expect(cwdArtifact).toBe(false);

    await writeFile(join(cwd, 'src/main.tsx'), '', 'utf8');

    const artifact2 = await artifactWriter(cwd, artifact);
    expect(artifact2).toBe(true);
  });

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

    const cwdArtifact = await artifactWriter(cwd, artifact);
    expect(cwdArtifact).toBe(true);
    const file = await readFile(join(cwd, 'checker.ts'), 'utf8');
    expect(file).toBe('current\ntransformed\n');
  });

  it('makes an executable artifact executable', async () => {
    const artifact = {
      ...emitted('standard', 'hook.sh', '#!/bin/sh\n'),
      executable: true,
    } satisfies Artifact;

    const cwdArtifact = await artifactWriter(cwd, artifact);
    expect(cwdArtifact).toBe(true);
    expect((await stat(join(cwd, 'hook.sh'))).mode & 0o111).toBe(0o111);
  });

  it('leaves an ordinary artifact without an execute bit', async () => {
    const artifact = await artifactWriter(cwd, emitted('standard', 'notes.md', '# notes\n'));
    expect(artifact).toBe(true);
    expect((await stat(join(cwd, 'notes.md'))).mode & 0o111).toBe(0);
  });
});
