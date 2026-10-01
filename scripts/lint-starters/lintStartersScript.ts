// Every starter text, written into a real project, installed and linted with type information.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { availableParallelism } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';

import PQueue from 'p-queue';

import { STARTER_CASES } from '@pipeline/e2e/starter-cover/constants';
import { starterCases } from '@pipeline/e2e/starter-cover/starterCover';

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
  fixedCopies,
  generate,
  packed,
  pruneTarballs,
  slugOf,
  spawnIn,
  stampOf,
  type Tarballs,
  writeAgreed,
} from './utils/caseUtils.ts';

import type { E2eCase } from '@pipeline/e2e/matrix/matrix';

type Outcome = 'linted' | 'unchanged' | 'failed';

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

// Install every time, so a changed tarball path reinstalls; `prepare` by hand, since a no-op install skips it
// and regenerating deletes what it wrote (`.nuxt/`, `.svelte-kit/`, typegen, the compiled catalog).
const lintCase = async (item: E2eCase): Promise<Outcome> => {
  const slug = slugOf(item.label);
  const dir = join(PROJECTS, slug);
  const stampPath = join(STAMPS, slug);

  await generate(item, dir, tarballs);

  const stamp = stampOf(dir);
  const isUnchanged = !every && !fixing && readStamp(stampPath) === stamp;

  if (isUnchanged) {
    return 'unchanged';
  }

  const installArgs = ['install', '--no-frozen-lockfile'];
  const installed = await spawnIn(dir, installArgs);

  if (!installed.ok) {
    return fail(item.label, 'install', installed.output);
  }

  const prepareArgs = [
    'run',
    '--if-present',
    'prepare',
  ];
  const prepared = await spawnIn(dir, prepareArgs);

  if (!prepared.ok) {
    return fail(item.label, 'prepare', prepared.output);
  }

  const lintArgs = [
    'exec',
    'eslint',
    '.',
    '--max-warnings',
    '0',
  ];
  const fixArgs = fixing ? ['--fix'] : [];
  const linted = await spawnIn(dir, [...lintArgs, ...fixArgs]);

  if (fixing) {
    copies.push(fixedCopies(item, dir));
  }

  if (!linted.ok) {
    return fail(item.label, 'lint', linted.output);
  }

  writeFileSync(stampPath, stamp, 'utf8');

  return 'linted';
};

const concurrency = Math.max(1, Math.floor(availableParallelism() / 2));
const queue = new PQueue({ concurrency });
const cases = starterCases(STARTER_CASES);
const runs = cases
  .map(async (item) => {
    return await queue
      .add(async () => {
        return await lintCase(item);
      });
  });
const outcomes = await Promise.all(runs);

const countOf = (outcome: Outcome): number => {
  return outcomes
    .filter((each) => {
      return each === outcome;
    })
    .length;
};

const failed = countOf('failed');

if (fixing) {
  const written = writeAgreed(copies);

  log(`${String(written.length)} starter templates fixed:\n  ${written.join('\n  ')}`);
}

log(`${String(cases.length)} starter projects: ${String(countOf('linted'))} linted, `
  + `${String(countOf('unchanged'))} unchanged since their last clean lint, ${String(failed)} failed`);

// A label that names no case would lint nothing and say nothing.
const isShort = cases.length !== STARTER_CASES.length;

if (isShort) {
  logError(`${String(STARTER_CASES.length - cases.length)} starter labels name no e2e case`);
}

process.exitCode = failed > 0 || isShort ? 1 : 0;
