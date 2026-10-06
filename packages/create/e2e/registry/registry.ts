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
import { join } from 'node:path';
import { env } from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';

import { parsePackageJson } from '@emitters';

import {
  CACHE_DIR,
  MS_PER_SECOND,
  NPM_CACHE_DIR,
  PING_ATTEMPTS,
  PING_INTERVAL,
  PORT,
  ROOT,
  RUN_DIR,
  UPSTREAM,
  WORKSPACE_MANIFESTS,
} from './constants';

import type { TestProject } from 'vitest/node';

interface StartedRegistry {
  registry: E2eRegistry;
  stop: () => void;
}

export interface E2eRegistry {
  url: string;
  version: string;
  cliBin: string;
  // Persists between runs: the registry's storage, and the caches keyed by the bytes they hold.
  cacheDir: string;
  runDir: string;
}

declare module 'vitest' {
  export interface ProvidedContext {
    registry: E2eRegistry;
  }
}

// bun keeps bytes and its record of which versions exist in one cache, so only the republished `@linteljs/*` goes.
const pruneBunCache = (): void => {
  const cache = join(CACHE_DIR, 'bun');

  mkdirSync(cache, { recursive: true });

  for (const name of readdirSync(cache)
    .filter((entry) => {
      return entry.includes('@linteljs');
    })) {
    rmSync(join(cache, name), {
      recursive: true,
      force: true,
    });
  }
};

// An orphaned verdaccio still answers `-/ping` while serving a directory this run deleted.
const requireFreePort = async (port: number): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const probe = createServer();

    probe
      .once('error', () => {
        reject(new Error(`127.0.0.1:${String(port)} is in use: a verdaccio from an earlier run is still listening`));
      });

    probe
      .once('listening', () => {
        probe
          .close(() => {
            resolve();
          });
      });

    probe.listen(port, '127.0.0.1');
  });
};

const answersPing = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(`${url}-/ping`);

    return response.ok;
  }
  catch {
    // Not listening yet.
    return false;
  }
};

const waitForPing = async (url: string, child: ChildProcess): Promise<void> => {
  for (let attempt = 0; attempt < PING_ATTEMPTS; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`verdaccio exited with ${String(child.exitCode)} before serving ${url}`);
    }

    const answered = await answersPing(url);

    if (answered) {
      return;
    }

    await sleep(PING_INTERVAL);
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

const createVersion = (): string => {
  const manifest = readFileSync(join(ROOT, 'packages/create/package.json'), 'utf8');
  const { version } = parsePackageJson(manifest);

  if (version === undefined) {
    throw new Error('packages/create/package.json carries no version');
  }

  return version;
};

// Not a prerelease: `2.0.0-e2e.x` sorts below `2.0.0` and satisfies no caret.
const runVersion = (base: string): string => {
  const [major, minor] = base.split('.');

  if (major === undefined || minor === undefined) {
    throw new Error(`packages/create/package.json carries no major.minor: ${base}`);
  }

  const epochSeconds = Math.floor(Date.now() / MS_PER_SECOND);

  return `${major}.${minor}.${String(epochSeconds)}`;
};

// A version published once never goes stale, so every resolution cache can persist.
const publishedAs = (version: string, publish: () => void): void => {
  const originals = WORKSPACE_MANIFESTS
    .map((path) => {
      const original = {
        path,
        text: readFileSync(path, 'utf8'),
      };

      return original;
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

// `E2E_UPSTREAM` stands in for npmjs where only a mirror is reachable.
const verdaccioConfig = (storage: string, upstream = UPSTREAM): string => {
  const lines = [
    `storage: ${storage}`,
    'uplinks:',
    '  npmjs:',
    `    url: ${upstream}`,
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
  ];

  return lines.join('\n');
};

export const startRegistry = async (): Promise<StartedRegistry> => {
  // Outside `RUN_DIR`; verdaccio rewrites `dist.tarball` per request, so storage survives a port change.
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

  writeFileSync(config, verdaccioConfig(storage, env['E2E_UPSTREAM']));

  const verdaccio = spawn(
    join(ROOT, 'node_modules/.bin/verdaccio'),
    [
      '--config',
      config,
      '--listen',
      `127.0.0.1:${String(PORT)}`,
    ],
    { stdio: 'inherit' },
  );

  await waitForPing(url, verdaccio);

  const version = runVersion(createVersion());

  publishedAs(version, () => {
    check('pnpm', [
      '-r',
      'publish',
      '--registry',
      url,
      '--no-git-checks',
    ], ROOT);
  });

  // Installed from the registry like a user's `create @linteljs`, on its published dependency tree.
  const cliDir = join(RUN_DIR, 'cli');

  mkdirSync(cliDir, { recursive: true });
  writeFileSync(join(cliDir, 'package.json'), '{}\n');

  check(
    'npm',
    [
      'install',
      `@linteljs/create@${version}`,
      '--registry',
      url,
      '--no-audit',
      '--no-fund',
    ],
    cliDir,
  );

  const started: StartedRegistry = {
    registry: {
      url,
      version,
      cliBin: join(cliDir, 'node_modules/.bin/create-linteljs'),
      cacheDir: CACHE_DIR,
      runDir: RUN_DIR,
    },
    stop: () => {
      verdaccio.kill();

      rmSync(NPM_CACHE_DIR, {
        recursive: true,
        force: true,
      });
    },
  };

  return started;
};

export const setup = async (project: TestProject): Promise<() => void> => {
  const { registry, stop } = await startRegistry();

  project.provide('registry', registry);

  return stop;
};
