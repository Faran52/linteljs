import {
  type ChildProcess,
  spawn,
  spawnSync,
} from 'node:child_process';
import {
  mkdirSync,
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

// A registry holding the workspace versions in front of npmjs, so an install resolves `@linteljs/*` to what is
// checked out and everything else to the real thing. Nothing published is ever consulted for this scope.
export const setup = async (project: TestProject): Promise<() => void> => {
  const {
    dir,
    port,
    cacheDir,
  } = pathsFor(project.vitest.config.shard);
  /**
   * Outside `dir`, so it survives the wipe. One npmjs tarball is stored once and served to all four managers, which
   * all speak the registry protocol, and verdaccio rewrites `dist.tarball` per request rather than storing a port.
   * Measured: the same storage on a different port with the uplink unreachable still serves metadata and tarballs.
   */
  const storage = join(cacheDir, 'registry');

  rmSync(dir, {
    recursive: true,
    force: true,
  });
  mkdirSync(dir, { recursive: true });
  mkdirSync(storage, { recursive: true });

  await requireFreePort(port);

  const url = `http://127.0.0.1:${String(port)}/`;
  const config = join(dir, 'verdaccio.yaml');

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
    ['--config', config, '--listen', `127.0.0.1:${String(port)}`],
    { stdio: 'inherit' },
  );

  await waitForPing(url, verdaccio);

  const version = runVersion(createVersion());

  await withPublishLock(() => {
    publishedAs(version, () => {
      check('pnpm', ['-r', 'publish', '--registry', url, '--no-git-checks'], ROOT);
    });
  });

  // Installed from the registry like a user's `create @linteljs`, so the bin runs on its published dependency tree.
  const cliDir = join(dir, 'cli');

  mkdirSync(cliDir, { recursive: true });
  writeFileSync(join(cliDir, 'package.json'), '{}\n');

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
