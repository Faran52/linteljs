import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { env } from 'node:process';
import { stripVTControlCharacters } from 'node:util';

import { inject } from 'vitest';

import { MANAGER_BINARIES } from '@config/constants';

import { LAUNCHER_KEYS, SPELLINGS } from '../constants';

import type { PackageManager } from '@answers';

export interface RunResult {
  status: number;
  output: string;
}

// The registry every case installs through, published by `registry.ts` before any of them run.
export const registry = inject('registry');

// `agent` is the one thing a case puts back: `LAUNCHER_KEYS` strips the launcher's own `npm_config_user_agent` below,
// and the CLI reads its manager from that variable, so a case that wants a manager says so by naming one.
export const run = async (
  command: string,
  args: string[],
  cwd: string,
  agent?: string,
): Promise<RunResult> => {
  /**
   * A generated project must not inherit which manager launched this suite. `run-p` reads `npm_execpath` to choose
   * what it spawns, and `pnpm run test:e2e` sets it, so `vue on bun` ran pnpm inside a project pinned to bun and got
   * `ERR_PNPM_OTHER_PM_EXPECTED`. Set under `pnpm run` and not `pnpm exec`, which is why it passed one way and
   * failed the other. `npm_config_registry` and the cache paths below are this suite's own and stay.
   */
  const parentEnv = Object.fromEntries(Object.entries(env).filter(([key]) => {
    return !LAUNCHER_KEYS.has(key)
      && !key.startsWith('npm_package_')
      && !key.startsWith('npm_lifecycle_')
      && !key.startsWith('VITEST');
  }));

  // `spawn` rather than `spawnSync`: a case is one `it.concurrent`, and a synchronous spawn blocks the event loop
  // for the whole install, so every case in a file would run one at a time however high `maxConcurrency` is set.
  return new Promise<RunResult>((settle) => {
    const child = spawn(command, args, {
      cwd,
      /**
       * `spawn`'s default stdin is an open pipe never ended, so anything reading it waits for ever, and
       * `pipelineRun.ts` hands it down through `stdio: 'inherit'`. `ignore` keeps an upstream prompt from hanging a
       * case.
       */
      stdio: ['ignore', 'pipe', 'pipe'],
      /**
       * Half the 600s a case is given, so a leg that stalls is killed and reported as itself: `close` fires with a
       * null code, `outcome` prints what the command had printed before it stopped, and the failure names its own
       * stage. Measured on 2026-09-24, one case per target across all five managers at concurrency two: a whole case
       * took 17 to 97 seconds, so one command is well under a third of this even on a slower CI runner.
       */
      timeout: 300_000,
      killSignal: 'SIGKILL',
      env: {
        ...parentEnv,
        npm_config_registry: registry.url,
        NPM_CONFIG_REGISTRY: registry.url,
        pnpm_config_registry: registry.url,
        /**
         * Only this workspace's own packages are exempt from pnpm's age gate: they are published seconds before a
         * case installs them, so no age rule can ever admit them. Everything else resolves under whatever policy the
         * machine carries, which is what a person's install does, so a case's lockfile is the one they would get.
         * Excluding a name does not exclude its dependencies, which is why the pattern names the scope and nothing
         * more: every dependency under it is a normal npm package with mature versions to choose from.
         */
        // JSON, because it is a list: measured, a bare `@linteljs/*` through the environment is silently ignored.
        pnpm_config_minimum_release_age_exclude: '["@linteljs/*"]',
        BUN_CONFIG_REGISTRY: registry.url,
        YARN_NPM_REGISTRY_SERVER: registry.url,
        YARN_UNSAFE_HTTP_WHITELIST: '127.0.0.1',
        YARN_NPM_MINIMAL_AGE_GATE: '0',
        /**
         * Split by what each directory remembers. A cache of bytes is keyed by the bytes and persists. A cache of
         * *which versions exist* starts empty every run, because `registry.ts` publishes a version no run has used
         * before and a manifest cached last run does not list it: the range resolves to the previous run's build and
         * the `why` assertion catches it. npm's cacache is integrity-keyed and needs neither treatment; bun's is
         * pruned of `@linteljs` by `registry.ts` at the start of a run, which is the same split spelled by hand.
         */
        npm_config_cache: join(registry.cacheDir, 'npm'),
        pnpm_config_store_dir: join(registry.cacheDir, 'pnpm-store'),
        pnpm_config_cache_dir: join(registry.runDir, 'pnpm-cache'),
        YARN_GLOBAL_FOLDER: join(registry.runDir, 'yarn'),
        YARN_CACHE_FOLDER: join(registry.cacheDir, 'yarn-cache'),
        BUN_INSTALL_CACHE_DIR: join(registry.cacheDir, 'bun'),
        ...(agent === undefined ? {} : { npm_config_user_agent: agent }),
      },
    });

    // Kept apart and joined at the end, the way `spawnSync` handed them over: every matcher in `INSTALL_NOISE` is
    // line-anchored, and interleaving two streams by chunk can split one line across a switch between them.
    const out: string[] = [];
    const err: string[] = [];
    // Without colour: a launcher setting `FORCE_COLOR` hands it to every manager, and a matcher then meets the
    // escape codes between a package's name and its version.
    const joined = (): string => {
      return stripVTControlCharacters(`${out.join('')}${err.join('')}`);
    };

    child.stdout.on('data', (chunk: Buffer) => {
      out.push(chunk.toString('utf8'));
    });
    child.stderr.on('data', (chunk: Buffer) => {
      err.push(chunk.toString('utf8'));
    });
    // A manager that is not installed at all, which is a failure to report rather than one to throw through.
    child.on('error', (error) => {
      settle({
        status: 1,
        output: `${joined()}${error.message}`,
      });
    });
    child.on('close', (code) => {
      settle({
        status: code ?? 1,
        output: joined(),
      });
    });
  });
};

// The run each manager's last queued command settles with, which the next one waits for.
const installs = new Map<PackageManager, Promise<RunResult>>();

// One install per manager at a time, pnpm excepted: its store is built for concurrent writers, and yarn's and bun's
// global caches are not. By manager rather than binary, since `versionFrom` lets only one yarn into a run.
export const oneAtATime = async (pm: PackageManager, work: () => Promise<RunResult>): Promise<RunResult> => {
  if (pm === 'pnpm') {
    return work();
  }

  const queued = async (): Promise<RunResult> => {
    await installs.get(pm);

    return work();
  };
  const next = queued();

  installs.set(pm, next);

  return next;
};

// Folds the exit status into the asserted value, so a failure prints the process output.
export const outcome = (result: RunResult, label: string): string => {
  return result.status === 0 ? `${label}: ok` : `${label}: exit ${String(result.status)}\n${result.output}`;
};

export const runPm = async (pm: PackageManager, args: string[], project: string): Promise<RunResult> => {
  const mapped = args.flatMap((arg) => {
    return SPELLINGS[pm][arg] ?? [arg];
  });

  return run(MANAGER_BINARIES[pm], mapped, project);
};
