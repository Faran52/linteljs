import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  type Dirent,
  type GlobOptionsWithFileTypes,
  globSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import {
  basename,
  join,
  relative,
} from 'node:path';
import { versions } from 'node:process';
import { promisify } from 'node:util';

import { TEMPLATES_ROOT } from '@disk';
import { writtenOf } from '@e2e/starter-cover/starterCover';
import { templateOf } from '@e2e/starter-cover/utils/copiedUtils';
import { starterSourceEmitter } from '@emitters';
import { pipelineRun } from '@pipeline';

import { packTarball, run } from '../../utils/processUtils.ts';
import {
  CONFIG_SPEC,
  HASH_PREFIX_LENGTH,
  KEPT,
  MAX_BUFFER,
  NOT_SLUG,
  OVERRIDES_KEY,
  PACKING,
  PROJECT_NAME,
  TARBALLS,
  UNSTAMPED,
} from '../constants.ts';

import type { E2eCase } from '@e2e/matrix/matrix';
import type { PipelineOptions } from '@pipeline/runs/pipeline/pipelineRun';

export interface Tarballs {
  config: string;
  plugin: string;
}

export interface Spawned {
  ok: boolean;
  output: string;
}

interface SpawnError extends Error {
  stdout: string;
  stderr: string;
}

const execFileAsync = promisify(execFile);

const sha = (bytes: Buffer | string): string => {
  return createHash('sha256')
    .update(bytes)
    .digest('hex')
    .slice(0, HASH_PREFIX_LENGTH);
};

export const slugOf = (label: string): string => {
  return label.replaceAll(NOT_SLUG, '-');
};

// Named by its hash, so a changed tarball is a changed path in package.json and pnpm reinstalls it.
export const packed = (name: string): string => {
  const outDir = join(PACKING, name);
  const tarball = packTarball(join('packages', name), outDir);
  const bytes = readFileSync(tarball);
  const kept = join(TARBALLS, `${name}-${sha(bytes)}.tgz`);

  mkdirSync(TARBALLS, { recursive: true });
  copyFileSync(tarball, kept);

  return kept;
};

export const pruneTarballs = (current: Tarballs): void => {
  const keep = new Set([basename(current.config), basename(current.plugin)]);
  const stale = readdirSync(TARBALLS)
    .filter((file) => {
      return !keep.has(file);
    });

  for (const file of stale) {
    rmSync(join(TARBALLS, file));
  }
};

const clear = (dir: string): void => {
  mkdirSync(dir, { recursive: true });

  const generated = readdirSync(dir)
    .filter((entry) => {
      return !KEPT.has(entry);
    });

  for (const entry of generated) {
    const path = join(dir, entry);
    const options = {
      recursive: true,
      force: true,
    };

    rmSync(path, options);
  }
};

const pnpmVersion = run('pnpm', ['--version'], '.')
  .trim();

export const generate = async (item: E2eCase, dir: string, tarballs: Tarballs): Promise<void> => {
  clear(dir);

  const answers = {
    ...item.answers,
    nodeVersion: versions.node,
    packageManagerVersion: pnpmVersion,
  };
  const options: PipelineOptions = {
    name: PROJECT_NAME,
    cwd: dir,
    answers,
    skip: ['install', 'fix'],
  };

  await pipelineRun(options);

  const manifest = join(dir, 'package.json');
  const text = await readFile(manifest, 'utf8');
  const local = text.replace(CONFIG_SPEC, `"@linteljs/eslint-config": "file:${tarballs.config}"`);

  await writeFile(manifest, local, 'utf8');

  // The config's own range on the plugin names a version npm may not have yet.
  const workspace = join(dir, 'pnpm-workspace.yaml');
  const yaml = await readFile(workspace, 'utf8');
  const override = `${OVERRIDES_KEY}  '@linteljs/eslint-plugin': 'file:${tarballs.plugin}'\n`;
  const hasOverrides = yaml.includes(OVERRIDES_KEY);
  const withOverride = hasOverrides ? yaml.replace(OVERRIDES_KEY, override) : `${yaml}${override}`;

  await writeFile(workspace, withOverride, 'utf8');
};

export const stampOf = (dir: string): string => {
  const options: GlobOptionsWithFileTypes = {
    cwd: dir,
    withFileTypes: true,
    exclude: (entry: Dirent) => {
      return UNSTAMPED.has(entry.name);
    },
  };
  const paths = globSync('**', options)
    .filter((entry) => {
      return entry.isFile();
    })
    .map((entry) => {
      const entryPath = join(entry.parentPath, entry.name);

      return relative(dir, entryPath);
    })
    .toSorted((left, right) => {
      return left.localeCompare(right);
    });
  const hash = createHash('sha256');

  for (const path of paths) {
    const bytes = readFileSync(join(dir, path));

    hash.update(`${path}\0`);
    hash.update(bytes);
  }

  return hash.digest('hex');
};

const isSpawnError = (error: unknown): error is SpawnError => {
  return error instanceof Error && 'stdout' in error && 'stderr' in error;
};

export const spawnIn = async (dir: string, args: string[]): Promise<Spawned> => {
  const options = {
    cwd: dir,
    encoding: 'utf8' as const,
    maxBuffer: MAX_BUFFER,
  };

  try {
    await execFileAsync('pnpm', args, options);

    const spawned: Spawned = {
      ok: true,
      output: '',
    };

    return spawned;
  }
  catch (error) {
    if (!isSpawnError(error)) {
      throw error;
    }

    const spawned: Spawned = {
      ok: false,
      output: `${error.stdout}${error.stderr}`,
    };

    return spawned;
  }
};

export const fixedCopies = (item: E2eCase, dir: string): Map<string, string> => {
  const artifacts = starterSourceEmitter(item.answers);
  const whole = writtenOf(artifacts)
    .flatMap((artifact) => {
      const text = readFileSync(join(dir, artifact.target), 'utf8');
      const source = templateOf(artifact, text);
      const copies = source === undefined ? [] : [[source, text] as const];

      return copies;
    });

  return new Map(whole);
};

// A template several cases copy is written back only when every one of them fixed it the same way.
export const writeAgreed = (copies: Map<string, string>[]): string[] => {
  const proposals = new Map<string, Set<string>>();

  const entries = copies
    .flatMap((each) => {
      const pairs = [...each];

      return pairs;
    });

  for (const [source, text] of entries) {
    const texts = proposals.get(source) ?? new Set<string>();

    texts.add(text);
    proposals.set(source, texts);
  }

  const written: string[] = [];

  for (const [source, texts] of proposals) {
    const templatePath = join(TEMPLATES_ROOT, source);
    const [only] = texts;
    const isAgreed = texts.size === 1 && only !== undefined;

    if (isAgreed && only !== readFileSync(templatePath, 'utf8')) {
      writeFileSync(templatePath, only, 'utf8');
      written.push(source);
    }
  }

  return written;
};
