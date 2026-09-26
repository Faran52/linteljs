import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { env, execPath } from 'node:process';

import { parsePackageJson } from '../../../src/emitters/always/package-json/packageJsonEmitter';
import { logWarn } from '../../../templates/project/scripts/utils/loggerUtils.ts';

import type { E2eRegistry } from '../../../src/pipeline/e2e/registry/registry';

// npm blocks a superset of pnpm: `@swc/core` and `fsevents` too, which pnpm and bun run unasked.
export type Collected = 'pnpm' | 'npm';

interface Pass {
  // Strips the allowance `create` wrote, so every package wanting a script is reported, not just the first.
  clear: (project: string) => void;
  install: string[];
  // Reads the installed tree, so it answers even after an install that refused every build.
  list: (project: string, registry: E2eRegistry) => Promise<string[]>;
}

interface ScriptEntry {
  name: string;
}

interface ScriptListing {
  allowScripts: ScriptEntry[];
}

// npm 12 blocks what 11 only warns about. Point `COLLECT_NPM` at an npm-cli.js to measure another major.
const NPM_CLI = env['COLLECT_NPM'];

export const NPM: [string, string[]] = NPM_CLI === undefined ? ['npm', []] : [execPath, [NPM_CLI]];

// stdout before stderr, as a whole: the listings below are parsed, and interleaved chunks would split a line.
export const run = async (
  command: string,
  args: string[],
  cwd: string,
  registry: E2eRegistry,
  agent?: string,
): Promise<string> => {
  const child = spawn(command, args, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...env,
      ...agent === undefined ? {} : { npm_config_user_agent: agent },
      npm_config_registry: registry.url,
      NPM_CONFIG_REGISTRY: registry.url,
      pnpm_config_registry: registry.url,
      // These builds are seconds old, the same exemption the end-to-end harness makes. JSON is pnpm's env shape.
      pnpm_config_minimum_release_age_exclude: '["@linteljs/*"]',
      npm_config_cache: join(registry.cacheDir, 'npm'),
      pnpm_config_store_dir: join(registry.cacheDir, 'pnpm-store'),
    },
  });
  const out: string[] = [];
  const err: string[] = [];

  child.stdout.setEncoding('utf8').on('data', (chunk: string) => {
    out.push(chunk);
  });
  child.stderr.setEncoding('utf8').on('data', (chunk: string) => {
    err.push(chunk);
  });
  await once(child, 'close');

  return [...out, ...err].join('');
};

const isScriptListing = (value: unknown): value is ScriptListing => {
  return typeof value === 'object'
    && value !== null
    && 'allowScripts' in value
    && Array.isArray(value.allowScripts);
};

export const PASSES: Record<Collected, Pass> = {
  pnpm: {
    clear: (project) => {
      const path = join(project, 'pnpm-workspace.yaml');

      writeFileSync(path, readFileSync(path, 'utf8').replace(/^allowBuilds:\n(?: {2}.*\n)*/m, 'allowBuilds: {}\n'));
    },
    install: ['install'],
    list: async (project, registry) => {
      const listing = await run('pnpm', ['ignored-builds'], project, registry);
      const names = /Automatically ignored builds during installation:\n((?: {2}\S+\n)+)/.exec(listing)?.[1];

      return names === undefined
        ? []
        : names.trim().split('\n').map((line) => {
            return line.trim();
          });
    },
  },
  npm: {
    clear: (project) => {
      const path = join(project, 'package.json');
      const manifest = parsePackageJson(readFileSync(path, 'utf8'));

      Reflect.deleteProperty(manifest, 'allowScripts');
      writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
    },
    install: ['install', '--no-audit', '--no-fund'],
    list: async (project, registry) => {
      const listing = await run(NPM[0], [...NPM[1], 'install-scripts', 'ls', '--json'], project, registry);
      const opening = listing.indexOf('{');

      if (opening === -1) {
        return [];
      }

      // A version without the subcommand answers prose, which is no reason to lose the whole run.
      try {
        const parsed: unknown = JSON.parse(listing.slice(opening));

        return isScriptListing(parsed)
          ? parsed.allowScripts.map((entry) => {
              return entry.name;
            })
          : [];
      }
      catch {
        logWarn(`npm install-scripts ls answered no JSON:\n${listing.slice(0, 400)}`);

        return [];
      }
    },
  },
};
