import {
  type ChildProcess,
  spawn,
  spawnSync,
} from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:net';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

import { parsePackageJson } from '../../../artifacts/package-json/emitPackageJson';

import type { TestProject } from 'vitest/node';

export interface E2eRegistry {
  url: string;
  version: string;
  cliBin: string;
  // Persists between runs, for downloads that carry their own checksum.
  cacheDir: string;
  // Wiped at the start of every run, for anything recording which tarball a version resolved to.
  runDir: string;
}

interface ShardPaths {
  dir: string;
  port: number;
}

interface ShardPaths {
  dir: string;
  port: number;
  cacheDir: string;
}

declare module 'vitest' {
  export interface ProvidedContext {
    registry: E2eRegistry;
  }
}

const ROOT = resolve(import.meta.dirname, '../../../../../..');
/**
 * Derived from the shard rather than chosen freshly: Yarn caches package metadata globally, tarball URLs included, and
 * Verdaccio answers its conditional request with 304 whenever upstream is unchanged, so a port that moved between runs
 * is a dead tarball host. One registry and one directory per shard, since shards are separate processes and on one
 * machine they would otherwise bind the same port and publish into the same storage.
 */
const BASE_PORT = 48730;

/**
 * `cacheDir` sits outside `dir` and is never wiped. A package manager's cache records the registry a tarball came
 * from, so a cache shared with another port serves URLs into a dead one, and a cache shared with an earlier run
 * serves the build published under this same version last time. Tying it to the shard that owns the port keeps both
 * true and still lets the next run reuse the downloads.
 */
const pathsFor = (shard: { index: number;
  count: number; }
  | undefined): ShardPaths => {
  const name = shard === undefined ? 'single' : `shard-${String(shard.index)}`;

  return {
    dir: join(ROOT, '.e2e', name),
    port: shard === undefined ? BASE_PORT : BASE_PORT + shard.index,
    cacheDir: join(ROOT, '.e2e-cache', name),
  };
};

// A verdaccio orphaned by a killed run still answers `-/ping`, so `waitForPing` would pass against a registry serving
// a directory this shard has just deleted, and every later request is refused. Fail on the clash instead.
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

/**
 * `bunx` and `bun create` read this cache whatever `BUN_INSTALL_CACHE_DIR` and `BUN_INSTALL` say, and key an entry by
 * registry host with no port. An entry left by a run on another port names a registry that is gone, so bun answers
 * `ConnectionRefused downloading tarball create-vue@3.24.0` before a scaffolder writes a file. Only this suite writes
 * a `127.0.0.1` key, so only those go.
 */
const purgeBunRegistryCache = (): void => {
  const cache = join(homedir(), '.bun', 'install', 'cache');

  if (!existsSync(cache)) {
    return;
  }

  for (const entry of readdirSync(cache)) {
    if (entry.includes('@@127.0.0.1@@')) {
      rmSync(join(cache, entry), {
        recursive: true,
        force: true,
      });
    }
  }
};

/**
 * Once per run, not once per shard: the cache is one directory for all of them, so a shard purging it while another
 * downloads deletes what that one just wrote. Called under the publish lock, so the first shard in does it and the
 * rest see the marker. Within a run every shard's port is live, so a shared entry resolves against a registry that
 * is up; the staleness only bites across runs that moved the port.
 */
const purgeOncePerRun = (): void => {
  const marker = join(ROOT, '.e2e', 'bun-cache.purged');

  if (existsSync(marker) && Date.now() - statSync(marker).mtimeMs < 60_000) {
    return;
  }

  purgeBunRegistryCache();
  writeFileSync(marker, '');
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

/**
 * Every `pnpm publish` fires `prepack`, which rebuilds all three packages into the one `dist/` they share. Shards are
 * separate processes against separate registries, so they publish at the same moment and tear each other's output.
 * `mkdir` is atomic, so it is the lock.
 */
const withPublishLock = async (run: () => void): Promise<void> => {
  const lock = join(ROOT, '.e2e', 'publish.lock');

  for (let attempt = 0; attempt < 600; attempt += 1) {
    try {
      mkdirSync(lock);
    }
    catch {
      await sleep(500);
      continue;
    }

    try {
      run();
    }
    finally {
      rmSync(lock, {
        recursive: true,
        force: true,
      });
    }

    return;
  }

  throw new Error(`another shard held ${lock} for five minutes`);
};

const createVersion = (): string => {
  const { version } = parsePackageJson(readFileSync(join(ROOT, 'packages/create/package.json'), 'utf8'));

  if (version === undefined) {
    throw new Error('packages/create/package.json carries no version');
  }

  return version;
};

// A registry holding the workspace versions in front of npmjs, so an install resolves `@linteljs/*` to what is
// checked out and everything else to the real thing. Nothing published is ever consulted for this scope.
export const setup = async (project: TestProject): Promise<() => void> => {
  const {
    dir,
    port,
    cacheDir,
  } = pathsFor(project.vitest.config.shard);

  rmSync(dir, {
    recursive: true,
    force: true,
  });
  mkdirSync(join(dir, 'storage'), { recursive: true });
  mkdirSync(cacheDir, { recursive: true });

  await requireFreePort(port);

  const url = `http://127.0.0.1:${String(port)}/`;
  const config = join(dir, 'verdaccio.yaml');

  writeFileSync(config, [
    `storage: ${join(dir, 'storage')}`,
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
    ['--config', config, '--listen', `127.0.0.1:${String(port)}`],
    { stdio: 'inherit' },
  );

  await waitForPing(url, verdaccio);

  await withPublishLock(() => {
    purgeOncePerRun();
    check('pnpm', ['-r', 'publish', '--registry', url, '--no-git-checks'], ROOT);
  });

  // Installed from the registry like a user's `create @linteljs`, so the bin runs on its published dependency tree.
  const cliDir = join(dir, 'cli');

  mkdirSync(cliDir, { recursive: true });
  writeFileSync(join(cliDir, 'package.json'), '{}\n');
  const version = createVersion();

  check(
    'npm',
    ['install', `@linteljs/create@${version}`, '--registry', url, '--no-audit', '--no-fund'],
    cliDir,
  );

  project.provide('registry', {
    url,
    version,
    cliBin: join(cliDir, 'node_modules/.bin/create-linteljs'),
    cacheDir,
    runDir: dir,
  });

  return () => {
    verdaccio.kill();
  };
};
