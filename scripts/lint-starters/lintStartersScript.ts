// Every starter text, written into a real project, installed, linted with type information, typechecked and run
// to full coverage; StyleX's also built.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { availableParallelism } from 'node:os';
import { join } from 'node:path';
import process, { env } from 'node:process';
import { parseArgs } from 'node:util';

import { once, Semaphore } from 'es-toolkit';

import { STARTER_CASES, STARTER_MIXES } from '@e2e/starter-cover/constants';
import { starterCases, starterMixes } from '@e2e/starter-cover/starterCover';

import {
  log,
  logError,
  logWarn,
} from '../../packages/create/templates/project/scripts/utils/loggerUtils.ts';
import { NO_CACHE_ENV } from '../gate/constants.ts';
import { run } from '../utils/processUtils.ts';

import {
  CACHE_ROOT,
  CONFIG_PACKAGE,
  DURATIONS,
  MS_PER_SECOND,
  PLUGIN_PACKAGE,
  PROJECTS,
  SCRATCH,
  STAMPS,
  TEST_SCRIPT,
  TYPECHECK_SCRIPT,
} from './constants.ts';
import {
  fixedCopies,
  generate,
  monorepoCaseOf,
  moveGenerated,
  packed,
  type ProjectDir,
  projectDirsOf,
  pruneTarballs,
  readDurations,
  registryError,
  secondsOf,
  slugOf,
  type Spawned,
  spawnIn,
  stampOf,
  type Tarballs,
  writeAgreed,
} from './utils/caseUtils.ts';
import { acquireLock } from './utils/lockUtils.ts';

import type { E2eCase } from '@e2e/matrix/matrix';

type Outcome = 'linted' | 'unchanged' | 'failed';

type Step = [string, () => Promise<Spawned>];

// A step's name and output.
type Failure = [string, string];

const flags = {
  all: { type: 'boolean' },
  fix: { type: 'boolean' },
} as const;
const { values } = parseArgs({ options: flags });
const every = values.all === true || env[NO_CACHE_ENV] !== undefined;
const fixing = values.fix === true;

const caseCount = STARTER_CASES.length + STARTER_MIXES.length;

await acquireLock();

if (!existsSync(CACHE_ROOT)) {
  logWarn(`No cache at ${CACHE_ROOT}: installing ${String(caseCount)} projects from scratch, `
    + 'which takes several minutes. Later runs reinstall only what changed.');
}

mkdirSync(STAMPS, { recursive: true });

// Inside a repository, a scratch project skips the `git init` generating runs.
const initialized = existsSync(join(SCRATCH, '.git'));

if (!initialized) {
  run('git', [
    'init',
    '--quiet',
    SCRATCH,
  ], '.');
}

const tarballs: Tarballs = {
  config: packed(CONFIG_PACKAGE),
  plugin: packed(PLUGIN_PACKAGE),
};

pruneTarballs(tarballs);

const readStamp = (path: string): string => {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
};

const fail = (label: string, failures: Failure[]): Outcome => {
  for (const [step, output] of failures) {
    logError(`${label}: ${step} ${output}`);
  }

  return 'failed';
};

const copies: Map<string, string>[] = [];
const prepareArgs = [
  'run',
  '--if-present',
  'prepare',
];

const failureOf = async ([name, run]: Step): Promise<Failure[]> => {
  const result = await run();
  const failures: Failure[] = result.ok ? [] : [[name, result.output]];

  return failures;
};

// The first step to fail; the rest do not run.
const firstFailure = async (steps: Step[]): Promise<Failure[]> => {
  for (const step of steps) {
    const failures = await failureOf(step);

    if (failures.length > 0) {
      return failures;
    }
  }

  return [];
};

const installArgs = ['install', '--no-frozen-lockfile'];

const registryCheck = once(registryError);

const installStep = (dir: string): Step => {
  const step: Step = ['install', async () => {
    const unreachable = await registryCheck(dir);

    if (unreachable !== undefined) {
      const refused: Spawned = {
        ok: false,
        output: unreachable,
      };

      return refused;
    }

    return spawnIn(dir, installArgs);
  }];

  return step;
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
const lintStep = (project: ProjectDir): Step => {
  const fixArgs = fixing ? ['--fix'] : [];
  const step: Step = ['lint', async () => {
    const linted = await spawnIn(project.dir, [...lintArgs, ...fixArgs]);

    if (fixing) {
      copies.push(fixedCopies(project));
    }

    return linted;
  }];

  return step;
};

// A starter that leaves code unrun fails its project's own 100% coverage gate.
const coverageSteps = ({ answers, dir }: ProjectDir): Step[] => {
  const steps = [stepOf(TEST_SCRIPT, dir, ['run', TEST_SCRIPT])];

  return answers.testing === 'none' ? [] : steps;
};

// StyleX resolves its theme imports only when it compiles, which lint never reaches.
const stylexSteps = ({ answers, dir }: ProjectDir): Step[] => {
  const steps = [stepOf('build', dir, ['run', 'build'])];

  return answers.styling === 'stylex' ? steps : [];
};

// A monorepo's root lints its own scripts/ apart from the projects.
const rootLintSteps = (item: E2eCase, dir: string): Step[] => {
  const steps = [stepOf('root lint', dir, lintArgs)];

  return item.answers.layout === 'monorepo' ? steps : [];
};

// Each reads the installed tree and writes only its own ignored output, so they run at once.
const checkSteps = (item: E2eCase, dir: string): Step[] => {
  const projectSteps = projectDirsOf(item, dir)
    .flatMap((project) => {
      const steps = [lintStep(project), ...coverageSteps(project)];

      return steps;
    });
  const steps = [...projectSteps, ...rootLintSteps(item, dir)];

  return steps;
};

const isUnchanged = (stampPath: string, stamp: string): boolean => {
  return !every && !fixing && readStamp(stampPath) === stamp;
};

// A typecheck regenerates the framework types the checks read (`next typegen`, `astro sync`), so it runs before
// them, and a build rewrites `.next/types`, so it runs after. A fix run keeps every step in turn, lint first.
const failuresIn = async (item: E2eCase, dir: string): Promise<Failure[]> => {
  const projects = projectDirsOf(item, dir);
  const prepares = projects
    .map((project) => {
      return stepOf('prepare', project.dir, prepareArgs);
    });
  const setup = [installStep(dir), ...prepares];
  const typechecks = projects
    .map((project) => {
      return stepOf(TYPECHECK_SCRIPT, project.dir, ['run', TYPECHECK_SCRIPT]);
    });
  const checks = checkSteps(item, dir);
  const builds = projects.flatMap(stylexSteps);

  if (fixing) {
    return firstFailure([
      ...setup,
      ...checks,
      ...typechecks,
      ...builds,
    ]);
  }

  const setupFailures = await firstFailure([...setup, ...typechecks]);

  if (setupFailures.length > 0) {
    return setupFailures;
  }

  const results = await Promise.all(checks.map(failureOf));
  const checkFailures = results.flat();

  return checkFailures.length > 0 ? checkFailures : firstFailure(builds);
};

/**
 * Generated apart first, so an unchanged project, and what `prepare` wrote in it, is left as it is. A changed one
 * moves in, installs every time, so a changed tarball path reinstalls, and runs `prepare` by hand, since a no-op
 * install skips it and regenerating deletes what it wrote (`.nuxt/`, `.svelte-kit/`, typegen, the compiled catalog).
 */
const lintCase = async (item: E2eCase): Promise<Outcome> => {
  const slug = slugOf(item.label);
  const dir = join(PROJECTS, slug);
  const scratch = join(SCRATCH, slug);
  const stampPath = join(STAMPS, slug);

  await generate(item, scratch, tarballs);

  const stamp = `${TYPECHECK_SCRIPT} ${TEST_SCRIPT} ${stampOf(scratch)}`;

  if (isUnchanged(stampPath, stamp)) {
    rmSync(scratch, {
      recursive: true,
      force: true,
    });

    return 'unchanged';
  }

  await moveGenerated(scratch, dir);

  // A kept lockfile keeps what a changed project no longer needs, such as an esbuild `allowBuilds` refuses.
  rmSync(join(dir, 'pnpm-lock.yaml'), { force: true });

  const failures = await failuresIn(item, dir);

  if (failures.length > 0) {
    return fail(item.label, failures);
  }

  writeFileSync(stampPath, stamp, 'utf8');

  return 'linted';
};

const concurrency = Math.max(1, Math.floor(availableParallelism() / 2));
const semaphore = new Semaphore(concurrency);
const labelled = starterCases(STARTER_CASES);
const [first] = labelled;
const monorepos = first === undefined ? [] : [monorepoCaseOf(first)];
const mixes = starterMixes(STARTER_MIXES);
const cases = [
  ...labelled,
  ...monorepos,
  ...mixes,
];
const durations = readDurations(DURATIONS);
const slowestFirst = cases
  .toSorted((left, right) => {
    return secondsOf(durations, right.label) - secondsOf(durations, left.label);
  });

const timedCase = async (item: E2eCase): Promise<Outcome> => {
  const started = performance.now();
  const outcome = await lintCase(item);

  if (outcome === 'linted') {
    durations[item.label] = Math.round((performance.now() - started) / MS_PER_SECOND);
  }

  return outcome;
};

const runs = slowestFirst
  .map(async (item) => {
    await semaphore.acquire();

    try {
      return await timedCase(item);
    }
    finally {
      semaphore.release();
    }
  });
const outcomes = await Promise.all(runs);

writeFileSync(DURATIONS, JSON.stringify(durations), 'utf8');

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
const isShort = labelled.length !== STARTER_CASES.length || mixes.length !== STARTER_MIXES.length;

if (isShort) {
  logError(`${String(STARTER_CASES.length - labelled.length)} starter labels and `
    + `${String(STARTER_MIXES.length - mixes.length)} starter mixes name no e2e case`);
}

process.exitCode = failed > 0 || isShort ? 1 : 0;
