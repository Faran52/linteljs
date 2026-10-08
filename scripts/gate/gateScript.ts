// The gate's steps after `build`, at once outside CI, each into its own log; a failed one prints a short excerpt.
import { spawn } from 'node:child_process';
import {
  closeSync,
  mkdirSync,
  openSync,
  readFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import process, { env } from 'node:process';

import { log, logError } from '../../packages/create/templates/project/scripts/utils/loggerUtils.ts';

import {
  BUILT_ENV,
  HEAD_LINES,
  LOG_DIR,
  MS_PER_SECOND,
  STEPS,
  TAIL_LINES,
} from './constants.ts';

interface Result {
  step: string;
  code: number;
  seconds: string;
  path: string;
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

const runStep = async (step: string): Promise<Result> => {
  const path = resolve(LOG_DIR, `${step.replaceAll(':', '-')}.log`);
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
      .on('close', (code) => {
        closeSync(out);

        const elapsed = (performance.now() - started) / MS_PER_SECOND;
        const seconds = elapsed.toFixed(1);

        done({
          step,
          code: code ?? 1,
          seconds,
          path,
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
  const status = result.code === 0 ? 'ok' : `FAILED (exit ${String(result.code)})`;

  log(`${result.step}: ${status} in ${result.seconds}s`);
}

for (const result of failed) {
  const excerpt = excerptOf(result.path)
    .join('\n  ');

  logError(`${result.step} failed, from ${result.path}:\n  ${excerpt}`);
}

process.exitCode = failed.length > 0 ? 1 : 0;
