import {
  mkdtemp,
  readFile,
  rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  afterEach,
  beforeEach,
  expect,
  it,
} from 'vitest';

import { type Artifact } from '@config/types';

import { emitted } from '@emitters/utils/artifactUtils';

import { projectWriter } from './projectWriter';

let cwd = '';

beforeEach(async () => {
  const prefix = join(tmpdir(), 'linteljs-io-write-');

  cwd = await mkdtemp(prefix);
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

it('writes every artifact, a seed too', async () => {
  const plainArtifact = emitted('package', 'src/plain.txt', 'plain');
  const seeded: Artifact = {
    ...emitted('package', 'seed.txt', 'seed'),
    seed: true,
  };

  await projectWriter(cwd, [plainArtifact, seeded]);

  const plain = await readFile(join(cwd, 'src/plain.txt'), 'utf8');
  const seed = await readFile(join(cwd, 'seed.txt'), 'utf8');
  expect([plain, seed]).toEqual(['plain', 'seed']);
});
