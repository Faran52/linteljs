// The gate's steps after `build`, at once outside CI, each into its own log; a failed one prints a short excerpt.
// Outside CI a step whose inputs all match its last pass is skipped whole (`docs/DESIGN.md`, Gate cache).
import { execFileSync, spawn } from 'node:child_process';
import {
  closeSync,
  mkdirSync,
  openSync,
  readFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import process, { env } from 'node:process';

import { signalOf } from '@e2e/starter-cover/utils/failureUtils';
import { resolvedBinary } from '@spawns/utils/binaryUtils';

import {
  isCached,
  recordPass,
  stepKeyOf,
} from '../../packages/create/scripts/gate/utils/stepCacheUtils.ts';
import { log, logError } from '../../packages/create/templates/project/scripts/utils/loggerUtils.ts';

import {
  BUILT_ENV,
  ENGINES,
  HEAD_LINES,
  IGNORED_INPUTS,
  LOG_DIR,
  MS_PER_SECOND,
  NO_CACHE_ENV,
  SKIPPED_SECONDS,
  STEPS,
  TAIL_LINES,
  UNCACHED,
  UNREAD,
} from './constants.ts';

interface Result {
  step: string;
  code: number;
  signal: string | undefined;
  seconds: string;
  path: string;
  cached: boolean;
  // The engine it needs, when that is not on PATH.
  missing: string | undefined;
}

// pnpm's own binary, by absolute path, rather than a lookup on PATH.
const {
  CI: ci,
  npm_execpath: manager,
  LINTELJS_GATE_SKIP: skip = '',
} = env;

if (manager === undefined) {
  throw new Error('Run the gate as `pnpm check`.');
}

mkdirSync(LOG_DIR, { recursive: true });

// CI runs `test:coverage` as shards of its own.
const skipped = skip.split(',');
const steps = STEPS
  .filter((step) => {
    return !skipped.includes(step);
  });

const versionOf = (name: string): string | undefined => {
  const binary = resolvedBinary(name);

  if (binary === undefined) {
    return undefined;
  }

  return execFileSync(binary, ['--version'], { encoding: 'utf8' });
};

const engineVersions = new Map<string, string | undefined>();

for (const [step, name] of ENGINES) {
  if (steps.includes(step)) {
    engineVersions.set(step, versionOf(name));
  }
}

// CI never reads or writes the cache: each run there starts clean.
const keyOf = (step: string): string | undefined => {
  if (ci !== undefined || UNCACHED.has(step)) {
    return undefined;
  }

  const root = process.cwd();
  const key = stepKeyOf(root, step, {
    excluded: UNREAD.get(step) ?? [],
    ignored: IGNORED_INPUTS,
    env,
  });
  const engine = engineVersions.get(step);

  return engine === undefined ? key : `${key} ${engine}`;
};

const runStep = async (step: string): Promise<Result> => {
  const path = resolve(LOG_DIR, `${step.replaceAll(':', '-')}.log`);
  const engine = ENGINES.get(step);

  if (engine !== undefined && engineVersions.get(step) === undefined) {
    const missingEngine: Result = {
      step,
      code: 0,
      signal: undefined,
      seconds: SKIPPED_SECONDS,
      path,
      cached: false,
      missing: engine,
    };

    return missingEngine;
  }

  const key = keyOf(step);

  if (key !== undefined && env[NO_CACHE_ENV] === undefined && isCached(LOG_DIR, step, key)) {
    const skippedStep: Result = {
      step,
      code: 0,
      signal: undefined,
      seconds: SKIPPED_SECONDS,
      path,
      cached: true,
      missing: undefined,
    };

    return skippedStep;
  }

  const out = openSync(path, 'w');
  const started = performance.now();
  const child = spawn(manager, ['run', step], {
    env: {
      ...env,
      [BUILT_ENV]: '1',
    },
    stdio: [
      'ignore',
      out,
      out,
    ],
  });

  return new Promise((done) => {
    child
      .on('close', (code, signal) => {
        closeSync(out);

        // Only a pass caches, and only when no input moved while the step ran.
        if (code === 0 && key !== undefined && keyOf(step) === key) {
          recordPass(LOG_DIR, step, key);
        }

        const elapsed = (performance.now() - started) / MS_PER_SECOND;
        const seconds = elapsed.toFixed(1);

        done({
          step,
          code: code ?? 1,
          signal: signalOf({
            code,
            signal,
          }),
          seconds,
          path,
          cached: false,
          missing: undefined,
        });
      });
  });
};

// pnpm's `$ command` echo and blank lines say nothing; CI shows all, since nothing else reads the log there.
const excerptOf = (path: string): string[] => {
  const lines = readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => {
      return line.trim() !== '' && !line.startsWith('$ ');
    });

  if (ci !== undefined || lines.length <= HEAD_LINES + TAIL_LINES) {
    return lines;
  }

  const head = lines.slice(0, HEAD_LINES);
  const tail = lines.slice(-TAIL_LINES);
  const excerpt = [
    ...head,
    '...',
    ...tail,
  ];

  return excerpt;
};

// A CI runner has 4 cores and the suite alone fills them, so there they run one after another.
const inSeries = async (prior: Promise<Result[]>, step: string): Promise<Result[]> => {
  const done = await prior;
  const result = await runStep(step);
  const all = [...done, result];

  return all;
};

const results = ci === undefined
  ? await Promise.all(steps.map(runStep))
  : await steps.reduce(inSeries, Promise.resolve<Result[]>([]));
const failed = results
  .filter((result) => {
    return result.code !== 0;
  });

for (const result of results) {
  const failure = result.signal === undefined
    ? `FAILED (exit ${String(result.code)})`
    : `KILLED by ${result.signal}, not a failure of the step: rerun it`;
  const status = result.code === 0 ? 'ok' : failure;
  const ran = result.cached
    ? `${result.step}: ok, inputs unchanged since it last passed`
    : `${result.step}: ${status} in ${result.seconds}s`;
  const line = result.missing === undefined
    ? ran
    : `${result.step}: skipped, \`${result.missing}\` is not on PATH`;

  log(line);
}

for (const result of failed) {
  const excerpt = excerptOf(result.path)
    .join('\n  ');

  logError(`${result.step} failed, from ${result.path}:\n  ${excerpt}`);
}

process.exitCode = failed.length > 0 ? 1 : 0;
