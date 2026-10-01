import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { env } from 'node:process';
import { stripVTControlCharacters } from 'node:util';

import { inject } from 'vitest';

import { LAUNCHER_KEYS, SPELLINGS } from '../constants';

import type { PackageManager } from '@config/types';

export interface RunResult {
  status: number;
  output: string;
}

export const registry = inject('registry');

// `LAUNCHER_KEYS` strips the launcher's `npm_config_user_agent`, so a case names its manager.
export const launcherFreeEnv = (): Record<string, string | undefined> => {
  // `run-p` reads `npm_execpath`, so a launcher's value would run its manager inside the case's project.
  const inherited = Object.entries(env)
    .filter(([key]) => {
      return !LAUNCHER_KEYS.has(key)
        && !key.startsWith('npm_package_')
        && !key.startsWith('npm_lifecycle_')
        && !key.startsWith('VITEST');
    });

  return Object.fromEntries(inherited);
};

export const run = async (
  command: string,
  args: string[],
  cwd: string,
  agent?: string,
): Promise<RunResult> => {
  const parentEnv = launcherFreeEnv();

  // `spawn`: a synchronous spawn blocks the event loop, so concurrent cases would run one at a time.
  return new Promise<RunResult>((settle) => {
    const child = spawn(command, args, {
      cwd,
      // `spawn`'s default stdin is an open pipe never ended, so an upstream prompt would hang the case.
      stdio: [
        'ignore',
        'pipe',
        'pipe',
      ],
      // Half the 600s a case gets, so a stalled leg is killed and named; measured cases took 17 to 97 seconds.
      timeout: 300_000,
      killSignal: 'SIGKILL',
      env: {
        ...parentEnv,
        npm_config_registry: registry.url,
        NPM_CONFIG_REGISTRY: registry.url,
        pnpm_config_registry: registry.url,
        /**
         * Only this workspace's packages skip pnpm's age gate: they are published seconds before install.
         * JSON, because it is a list: a bare `@linteljs/*` through the environment is silently ignored.
         * Yarn and bun take theirs from the project's own `.yarnrc.yml` and `bunfig.toml`.
         */
        pnpm_config_minimum_release_age_exclude: '["@linteljs/*"]',
        BUN_CONFIG_REGISTRY: registry.url,
        YARN_NPM_REGISTRY_SERVER: registry.url,
        YARN_UNSAFE_HTTP_WHITELIST: '127.0.0.1',
        // A cache of which versions exist starts empty every run; a cache of bytes persists.
        npm_config_cache: join(registry.cacheDir, 'npm'),
        pnpm_config_store_dir: join(registry.cacheDir, 'pnpm-store'),
        pnpm_config_cache_dir: join(registry.runDir, 'pnpm-cache'),
        YARN_GLOBAL_FOLDER: join(registry.runDir, 'yarn'),
        YARN_CACHE_FOLDER: join(registry.cacheDir, 'yarn-cache'),
        BUN_INSTALL_CACHE_DIR: join(registry.cacheDir, 'bun'),
        ...(agent === undefined ? {} : { npm_config_user_agent: agent }),
      },
    });

    // Joined at the end: interleaving by chunk can split a line the line-anchored matchers read.
    const out: string[] = [];
    const err: string[] = [];
    // Without colour: a launcher's `FORCE_COLOR` puts escape codes between a package's name and version.
    const joined = (): string => {
      return stripVTControlCharacters(`${out.join('')}${err.join('')}`);
    };

    child.stdout
      .on('data', (chunk: Buffer) => {
        out.push(chunk.toString('utf8'));
      });
    child.stderr
      .on('data', (chunk: Buffer) => {
        err.push(chunk.toString('utf8'));
      });
    // A manager that is not installed is a failure to report, not one to throw through.
    child
      .on('error', (error) => {
        settle({
          status: 1,
          output: `${joined()}${error.message}`,
        });
      });
    child
      .on('close', (code) => {
        settle({
          status: code ?? 1,
          output: joined(),
        });
      });
  });
};

const installs = new Map<PackageManager, Promise<RunResult>>();

// pnpm's store is built for concurrent writers; yarn's and bun's global caches are not.
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

// Folded into the asserted value, so a failure prints the process output.
export const outcome = (result: RunResult, label: string): string => {
  return result.status === 0 ? `${label}: ok` : `${label}: exit ${String(result.status)}\n${result.output}`;
};

export const runPm = async (pm: PackageManager, args: string[], project: string): Promise<RunResult> => {
  const mapped = args
    .flatMap((arg) => {
      return SPELLINGS[pm][arg] ?? [arg];
    });

  return run(pm, mapped, project);
};
