import {
  type ChildProcess,
  spawn,
  spawnSync,
} from 'node:child_process';
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:net';
import { join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

import { parsePackageJson } from '../../../artifacts/package-json/emitPackageJson';

import type { TestProject } from 'vitest/node';

export interface E2eRegistry {
  url: string;
  version: string;
  cliBin: string;
  // Persists between runs: the registry's storage, and the caches keyed by the bytes they hold.
  cacheDir: string;
  // Wiped at the start of every run, for anything recording which versions exist.
  runDir: string;
}

declare module 'vitest' {
  export interface ProvidedContext {
    registry: E2eRegistry;
  }
}

const ROOT = resolve(import.meta.dirname, '../../../../../..');

/**
 * One registry for a run, on a fixed port. Sharding is a stride over the cases inside one process (`cases.ts`), and
 * every shard in `e2e.yml` is its own machine, so two registries never want the same machine at once. Fixed rather
 * than chosen freshly because Yarn caches package metadata globally, tarball URLs included, and Verdaccio answers its
 * conditional request with 304 whenever upstream is unchanged: a port that moved between runs is a dead tarball host.
 *
 * This is also what makes bun usable. `bunx` and `bun create` resolve a scaffolder against whatever registry they
 * find and got `ConnectionRefused` whenever a second port existed on the same machine, which is the only reason the
 * suite was ever documented as CI-shards-only.
 */
const PORT = 48730;

// Wiped at the start of every run: anything recording which versions exist rather than what bytes they hold.
const RUN_DIR = join(ROOT, '.e2e');

// Never wiped, and outside `RUN_DIR`. A package manager's cache records the registry a tarball came from, which the
// fixed port above keeps valid between runs, so every download survives to the next one.
const CACHE_DIR = join(ROOT, '.e2e-cache');

/**
 * bun's cache is the one that cannot tell "these bytes" from "these versions exist", so the suite used to throw the
 * whole thing away every run and re-download every dependency of every bun case. Only `@linteljs/*` is republished
 * under a version a cached manifest cannot know about, so only `@linteljs/*` has to go. Anything this misses fails
 * loudly rather than quietly: `verifyLintOutput` asserts the resolved version is this run's.
 */
const pruneBunCache = (): void => {
  const cache = join(CACHE_DIR, 'bun');

  mkdirSync(cache, { recursive: true });

  // A scope directory, a flattened `@linteljs%2f*` entry and a `.npm` manifest beside it all carry the scope.
  for (const name of readdirSync(cache).filter((entry) => {
    return entry.includes('@linteljs');
  })) {
    rmSync(join(cache, name), {
      recursive: true,
      force: true,
    });
  }
};

// A verdaccio orphaned by a killed run still answers `-/ping`, so `waitForPing` would pass against a registry serving
// a directory this run has just deleted, and every later request is refused. Fail on the clash instead.
const requireFreePort = async (port: number): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const probe = createServer();

    probe.once('error', () => {
      reject(new Error(`127.0.0.1:${String(port)} is in use: a verdaccio from an earlier run is still listening`));
    });
    probe.once('listening', () => {
      probe.close(() => {
        resolve();
      });
    });
    probe.listen(port, '127.0.0.1');
  });
};

const waitForPing = async (url: string, child: ChildProcess): Promise<void> => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`verdaccio exited with ${String(child.exitCode)} before serving ${url}`);
    }

    try {
      const response = await fetch(`${url}-/ping`);

      if (response.ok) {
        return;
      }
    }
    catch {
      // Not listening yet.
    }

    await sleep(200);
  }

  throw new Error(`verdaccio did not answer at ${url} within 20 seconds`);
};

const check = (command: string, args: string[], cwd: string): void => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited ${String(result.status)}\n${result.stdout}${result.stderr}`);
  }
};

const WORKSPACE_MANIFESTS = ['create', 'eslint-config', 'eslint-plugin'].map((name) => {
  return join(ROOT, 'packages', name, 'package.json');
});

const createVersion = (): string => {
  const { version } = parsePackageJson(readFileSync(join(ROOT, 'packages/create/package.json'), 'utf8'));

  if (version === undefined) {
    throw new Error('packages/create/package.json carries no version');
  }

  return version;
};

/**
 * Unique, increasing, and inside the `^1.6.0` a generated project asks for. Not a prerelease: `1.6.0-e2e.x` sorts
 * below `1.6.0` and satisfies no caret, so every install would resolve nothing. A patch of the current second
 * satisfies the range and is always the highest, so `maxSatisfying` picks this run's build.
 */
const runVersion = (base: string): string => {
  const [major, minor] = base.split('.');

  if (major === undefined || minor === undefined) {
    throw new Error(`packages/create/package.json carries no major.minor: ${base}`);
  }

  return `${major}.${minor}.${String(Math.floor(Date.now() / 1000))}`;
};

/**
 * A version no run has published before. The suite used to republish one version with different bytes, so every
 * directory recording which tarball a version resolved to had to start empty, which is what kept bun's whole cache
 * and yarn's metadata cold on every run. A version published once can never go stale, so all of them persist.
 * `workspace:*` between the three resolves to whatever is published, so they move together.
 */
const publishedAs = (version: string, publish: () => void): void => {
  const originals = WORKSPACE_MANIFESTS.map((path) => {
    return {
      path,
      text: readFileSync(path, 'utf8'),
    };
  });

  try {
    for (const { path, text } of originals) {
      writeFileSync(path, text.replace(/"version": "[^"]*"/, `"version": "${version}"`));
    }

    publish();
  }
  finally {
    for (const { path, text } of originals) {
      writeFileSync(path, text);
    }
  }
};

/**
 * A registry holding the workspace versions in front of npmjs, so an install resolves `@linteljs/*` to what is
 * checked out and everything else to the real thing. Nothing published is ever consulted for this scope.
 *
 * Exported apart from `setup` because the suite is not its only caller: `scripts/collectBuildScripts.ts` needs the
 * same registry and the same freshly published CLI, and duplicating a hundred lines of verdaccio wiring to get them
 * is how the two drift.
 */
export const startRegistry = async (): Promise<{ registry: E2eRegistry;
  stop: () => void; }> => {
  /**
   * Outside `RUN_DIR`, so it survives the wipe. One npmjs tarball is stored once and served to all four managers,
   * which all speak the registry protocol, and verdaccio rewrites `dist.tarball` per request rather than storing a
   * port. Measured: the same storage on a different port with the uplink unreachable still serves both.
   */
  const storage = join(CACHE_DIR, 'registry');

  rmSync(RUN_DIR, {
    recursive: true,
    force: true,
  });
  mkdirSync(RUN_DIR, { recursive: true });
  mkdirSync(storage, { recursive: true });
  pruneBunCache();

  await requireFreePort(PORT);

  const url = `http://127.0.0.1:${String(PORT)}/`;
  const config = join(RUN_DIR, 'verdaccio.yaml');

  writeFileSync(config, [
    `storage: ${storage}`,
    'uplinks:',
    '  npmjs:',
    '    url: https://registry.npmjs.org/',
    // Defaults are 2 and 5m: two transient failures refuse every later request as a 404 for five minutes.
    '    max_fails: 30',
    '    fail_timeout: 10s',
    '    timeout: 60s',
    'packages:',
    "  '@linteljs/*':",
    '    access: $all',
    '    publish: $all',
    "  '**':",
    '    access: $all',
    '    proxy: npmjs',
    'log:',
    '  type: stdout',
    '  level: error',
    '',
  ].join('\n'));

  const verdaccio = spawn(
    join(ROOT, 'node_modules/.bin/verdaccio'),
    ['--config', config, '--listen', `127.0.0.1:${String(PORT)}`],
    { stdio: 'inherit' },
  );

  await waitForPing(url, verdaccio);

  const version = runVersion(createVersion());

  publishedAs(version, () => {
    check('pnpm', ['-r', 'publish', '--registry', url, '--no-git-checks'], ROOT);
  });

  // Installed from the registry like a user's `create @linteljs`, so the bin runs on its published dependency tree.
  const cliDir = join(RUN_DIR, 'cli');

  mkdirSync(cliDir, { recursive: true });
  writeFileSync(join(cliDir, 'package.json'), '{}\n');

  check(
    'npm',
    ['install', `@linteljs/create@${version}`, '--registry', url, '--no-audit', '--no-fund'],
    cliDir,
  );

  return {
    registry: {
      url,
      version,
      cliBin: join(cliDir, 'node_modules/.bin/create-linteljs'),
      cacheDir: CACHE_DIR,
      runDir: RUN_DIR,
    },
    stop: () => {
      verdaccio.kill();
    },
  };
};

// The vitest half: `globalSetup` hands the registry to every case through `inject`.
export const setup = async (project: TestProject): Promise<() => void> => {
  const { registry, stop } = await startRegistry();

  project.provide('registry', registry);

  return stop;
};
