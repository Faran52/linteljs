// Every starter text, written into a real project, installed and linted with type information; StyleX's also
// tested and built.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { availableParallelism } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';

import { Semaphore } from 'es-toolkit';

import { STARTER_CASES } from '@e2e/starter-cover/constants';
import { starterCases } from '@e2e/starter-cover/starterCover';

import {
  log,
  logError,
  logWarn,
} from '../../packages/create/templates/project/scripts/utils/loggerUtils.ts';

import {
  CACHE_ROOT,
  CONFIG_PACKAGE,
  PLUGIN_PACKAGE,
  PROJECTS,
  STAMPS,
} from './constants.ts';
import {
  appDirOf,
  fixedCopies,
  generate,
  monorepoCaseOf,
  packed,
  pruneTarballs,
  slugOf,
  type Spawned,
  spawnIn,
  stampOf,
  type Tarballs,
  writeAgreed,
} from './utils/caseUtils.ts';

import type { E2eCase } from '@e2e/matrix/matrix';

type Outcome = 'linted' | 'unchanged' | 'failed';

type Step = [string, () => Promise<Spawned>];

const flags = {
  all: { type: 'boolean' },
  fix: { type: 'boolean' },
} as const;
const { values } = parseArgs({ options: flags });
const every = values.all === true;
const fixing = values.fix === true;

if (!existsSync(CACHE_ROOT)) {
  logWarn(`No cache at ${CACHE_ROOT}: installing ${String(STARTER_CASES.length)} projects from scratch, `
    + 'which takes several minutes. Later runs reinstall only what changed.');
}

mkdirSync(STAMPS, { recursive: true });

const tarballs: Tarballs = {
  config: packed(CONFIG_PACKAGE),
  plugin: packed(PLUGIN_PACKAGE),
};

pruneTarballs(tarballs);

const readStamp = (path: string): string => {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
};

const fail = (label: string, step: string, output: string): Outcome => {
  logError(`${label}: ${step} failed\n${output}`);

  return 'failed';
};

const copies: Map<string, string>[] = [];
const prepareArgs = [
  'run',
  '--if-present',
  'prepare',
];

// The name and output of the first step to fail; the rest do not run.
const firstFailure = async (steps: Step[]): Promise<[string, string] | undefined> => {
  for (const [name, run] of steps) {
    const result = await run();

    if (!result.ok) {
      const failure: [string, string] = [name, result.output];

      return failure;
    }
  }

  return undefined;
};

const stepOf = (name: string, dir: string, args: string[]): Step => {
  const step: Step = [name, async () => {
    return spawnIn(dir, args);
  }];

  return step;
};

const lintArgs = [
  'exec',
  'eslint',
  '.',
  '--max-warnings',
  '0',
];

// A fix run keeps its copies whether or not the lint passed.
const lintStep = (item: E2eCase, dir: string): Step => {
  const fixArgs = fixing ? ['--fix'] : [];
  const step: Step = ['lint', async () => {
    const linted = await spawnIn(dir, [...lintArgs, ...fixArgs]);

    if (fixing) {
      copies.push(fixedCopies(item, dir));
    }

    return linted;
  }];

  return step;
};

// StyleX resolves its theme imports only when it compiles, which lint never reaches.
const stylexSteps = (item: E2eCase, dir: string): Step[] => {
  const steps = [stepOf('test', dir, ['run', 'test']), stepOf('build', dir, ['run', 'build'])];

  return item.answers.styling === 'stylex' ? steps : [];
};

// A monorepo's root lints its own scripts/ apart from the app.
const rootLintSteps = (item: E2eCase, dir: string): Step[] => {
  const steps = [stepOf('root lint', dir, lintArgs)];

  return item.answers.layout === 'monorepo' ? steps : [];
};

const caseSteps = (item: E2eCase, dir: string): Step[] => {
  const installArgs = ['install', '--no-frozen-lockfile'];
  const app = appDirOf(item, dir);
  const steps = [
    stepOf('install', dir, installArgs),
    stepOf('prepare', app, prepareArgs),
    lintStep(item, app),
    ...stylexSteps(item, app),
    ...rootLintSteps(item, dir),
  ];

  return steps;
};

const isUnchanged = (stampPath: string, stamp: string): boolean => {
  return !every && !fixing && readStamp(stampPath) === stamp;
};

// Install every time, so a changed tarball path reinstalls; `prepare` by hand, even when unchanged, since a no-op
// install skips it and regenerating deletes what it wrote (`.nuxt/`, `.svelte-kit/`, typegen, the compiled catalog).
const lintCase = async (item: E2eCase): Promise<Outcome> => {
  const slug = slugOf(item.label);
  const dir = join(PROJECTS, slug);
  const stampPath = join(STAMPS, slug);

  await generate(item, dir, tarballs);

  const stamp = stampOf(dir);

  if (isUnchanged(stampPath, stamp)) {
    const reprepared = await spawnIn(appDirOf(item, dir), prepareArgs);

    return reprepared.ok ? 'unchanged' : fail(item.label, 'prepare', reprepared.output);
  }

  // A kept lockfile keeps what a changed project no longer needs, such as an esbuild `allowBuilds` refuses.
  rmSync(join(dir, 'pnpm-lock.yaml'), { force: true });

  const steps = caseSteps(item, dir);
  const failure = await firstFailure(steps);

  if (failure) {
    return fail(item.label, ...failure);
  }

  writeFileSync(stampPath, stamp, 'utf8');

  return 'linted';
};

const concurrency = Math.max(1, Math.floor(availableParallelism() / 2));
const semaphore = new Semaphore(concurrency);
const labelled = starterCases(STARTER_CASES);
const [first] = labelled;
const monorepos = first === undefined ? [] : [monorepoCaseOf(first)];
const cases = [...labelled, ...monorepos];
const runs = cases
  .map(async (item) => {
    await semaphore.acquire();

    try {
      return await lintCase(item);
    }
    finally {
      semaphore.release();
    }
  });
const outcomes = await Promise.all(runs);

const countOf = (outcome: Outcome): number => {
  return outcomes
    .filter((each) => {
      return each === outcome;
    })
    .length;
};

const linted = countOf('linted');
const unchanged = countOf('unchanged');
const failed = countOf('failed');

if (fixing) {
  const written = writeAgreed(copies);

  log(`${String(written.length)} starter templates fixed:\n  ${written.join('\n  ')}`);
}

log(`${String(cases.length)} starter projects: ${String(linted)} linted, `
  + `${String(unchanged)} unchanged since their last clean lint, ${String(failed)} failed`);

// A label that names no case would lint nothing and say nothing.
const isShort = labelled.length !== STARTER_CASES.length;

if (isShort) {
  logError(`${String(STARTER_CASES.length - labelled.length)} starter labels name no e2e case`);
}

process.exitCode = failed > 0 || isShort ? 1 : 0;
