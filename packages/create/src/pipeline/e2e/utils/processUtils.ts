import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { env } from 'node:process';

import { inject } from 'vitest';

import { MANAGER_BINARIES } from '@config/constants';

import { LAUNCHER_KEYS, SPELLINGS } from '../constants';

import type { PackageManager } from '@answers';

export interface RunResult {
  status: number;
  output: string;
}

// The registry every case installs through, published by `registrySetup` before any of them run.
export const registry = inject('registry');

// `agent` is the one thing a case puts back: `LAUNCHER_KEYS` strips the launcher's own `npm_config_user_agent` below,
// and the CLI now reads its manager from that variable, so a case that wants a manager says so by naming one.
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
    return !LAUNCHER_KEYS.has(key) && !key.startsWith('npm_package_') && !key.startsWith('npm_lifecycle_');
  }));

  // `spawn` rather than `spawnSync`: a case is one `it.concurrent`, and a synchronous spawn blocks the event loop
  // for the whole install, so every case in a file would run one at a time however high `maxConcurrency` is set.
  return new Promise<RunResult>((settle) => {
    const child = spawn(command, args, {
      cwd,
      /**
       * `spawnSync` was handed `input: ''`, which closed every child's stdin; `spawn`'s default leaves it an open
       * pipe that is never written and never ended, so anything that reads stdin waits for ever. `pipeline.ts`
       * spawns the scaffolder and the install with `stdio: 'inherit'`, so that dead pipe is inherited all the way
       * down. Nothing prompts today; `ignore` is what keeps that true when some upstream tool grows a question.
       */
      stdio: ['ignore', 'pipe', 'pipe'],
      /**
       * Well inside the 900s a case is given, so a leg that stalls is killed and reported as itself: `close` fires
       * with a null code, `outcome` prints what the command had printed before it stopped, and the failure names
       * its own stage. Without it a stall is a bare per-case timeout carrying nothing, which is what four
       * concurrent `vite build` and `ng build` runs produced.
       */
      timeout: 600_000,
      killSignal: 'SIGKILL',
      env: {
        ...parentEnv,
        npm_config_registry: registry.url,
        NPM_CONFIG_REGISTRY: registry.url,
        pnpm_config_registry: registry.url,
        // pnpm 12 and Yarn 4 refuse a version younger than their age gate, and the workspace ones are seconds old.
        pnpm_config_minimum_release_age: '0',
        BUN_CONFIG_REGISTRY: registry.url,
        YARN_NPM_REGISTRY_SERVER: registry.url,
        YARN_UNSAFE_HTTP_WHITELIST: '127.0.0.1',
        YARN_NPM_MINIMAL_AGE_GATE: '0',
        /**
         * Split by what each directory remembers. A cache of bytes is keyed by the bytes and persists. A cache of
         * *which versions exist* starts empty every run, because `registrySetup` publishes a version no run has used
         * before and a manifest cached last run does not list it: the range resolves to the previous run's build and
         * the `why` assertion catches it. Publishing a unique version ends the other staleness, where one version was
         * republished with different bytes and bun reported `Integrity check failed`, but not this one.
         * npm's cacache is integrity-keyed and needs neither treatment; bun's is pruned of `@linteljs` by
         * `registrySetup` at the start of a run, which is the same split spelled by hand.
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
    const joined = (): string => {
      return `${out.join('')}${err.join('')}`;
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
