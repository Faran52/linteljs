/**
 * Every build script a generated project can meet, collected in one pass instead of one failure at a time.
 *
 * pnpm refuses an unlisted `postinstall` and aborts the install, so a package that starts shipping one breaks
 * `create` for whoever picks the answer that pulls it. `vue-demi` was found that way: it reaches only an Astro or
 * extension project hosting Vue with TanStack Query selected, which is the 1,187th combination of 1,200 and was
 * caught by the end-to-end matrix rather than by anything cheaper.
 *
 * This is the cheaper thing. It installs the maximal dependency set of every target with its `allowBuilds` block
 * emptied, so pnpm reports every package that wanted to run a script rather than only the first unlisted one, and
 * prints the table. What it prints belongs in `allowBuilds` on the record, or in `SHARED_ALLOWED_BUILDS` where every
 * target sees it.
 *
 * Run it after a dependency bump, not on every commit: it is seventeen real installs.
 *
 *   pnpm --filter @linteljs/create collect:builds
 */
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process, { env } from 'node:process';

import {
  ANSWERS,
  type Answers,
  DEFAULT_ANSWERS,
  type HostedFramework,
  type TargetId,
} from '../src/answers';
import { parsePackageJson } from '../src/emitters/always/package-json/packageJsonEmitter';
import { startRegistry } from '../src/pipeline/e2e/registrySetup';
import { targetFor } from '../src/targets';
import { valuesOf } from '../src/utils/objectUtils';

import type { E2eCase } from '../src/pipeline/e2e/cases';
import type { E2eRegistry } from '../src/pipeline/e2e/registrySetup';

/**
 * Both managers, because they do not block the same set. npm blocks a *superset*: every install script it has not
 * been told about, plus `@swc/core` and `fsevents`, which pnpm and bun run unasked. A list measured on pnpm alone
 * therefore closes pnpm and bun and leaves npm's extra two to a constant that nothing re-measures. This is what
 * re-measures it.
 */
type Collected = 'pnpm' | 'npm';

interface Pass {
  // Strips the allowance out of what `create` wrote, so every package that wants a script is reported.
  clear: (project: string) => void;
  install: string[];
  // Reads the installed tree, so both still answer after an install that refused to build anything.
  list: (project: string, registry: E2eRegistry) => string[];
}

interface ScriptEntry {
  name: string;
}

interface ScriptListing {
  allowScripts: ScriptEntry[];
}

const AGENTS = valuesOf(ANSWERS.agents.values);
const HOSTED_FRAMEWORKS = valuesOf(ANSWERS.hostedFramework.values);
const LIBRARIES = valuesOf(ANSWERS.libraries.values);
const PLUGINS = valuesOf(ANSWERS.plugins.values);
const SURFACES = valuesOf(ANSWERS.surfaces.values);
const TARGET_IDS = valuesOf(ANSWERS.target.values);

/**
 * Which npm the npm pass runs. A generated project declares npm 11, which *warns* about an uncovered install script
 * where npm 12 *blocks* it, and the pin stays until `create-expo-app` stops reading `npm pack --dry-run --json` as
 * an array (4.0.0 still throws `Invalid response from npm` on npm 12's object). The question of what npm 12 will
 * refuse is answerable before then, so point this at one:
 *
 *   npm install --prefix /tmp/npm12 npm@12
 *   COLLECT_NPM=/tmp/npm12/node_modules/npm/bin/npm-cli.js pnpm --filter @linteljs/create collect:builds
 */
const NPM_CLI = env['COLLECT_NPM'];
const NPM: [string, string[]] = NPM_CLI === undefined ? ['npm', []] : ['node', [NPM_CLI]];

/**
 * Everything installable turned on, which is what makes one run per target enough: every library, every agent and
 * plugin, a store and a form and a router wherever the target offers one, and a suite, since test dependencies carry
 * build scripts of their own. The axes left at their default are the ones that only ever *replace* a package rather
 * than add one, so a second pass over them would install nothing new.
 */
const maximal = (target: TargetId, hostedFramework: HostedFramework | undefined): Answers => {
  const record = targetFor({
    ...DEFAULT_ANSWERS,
    target,
    ...(hostedFramework === undefined ? {} : { hostedFramework }),
  });

  return {
    ...DEFAULT_ANSWERS,
    target,
    libraries: LIBRARIES,
    agents: AGENTS,
    plugins: PLUGINS,
    testing: 'vitest',
    store: record.store !== undefined,
    form: 'tanstack-form',
    ...(hostedFramework === undefined ? {} : { hostedFramework }),
    ...(record.routers === undefined ? {} : { router: record.routers[0] }),
    ...(target === 'webextension' ? { surfaces: SURFACES } : {}),
  };
};

// Seventeen: the seven plain targets, plus Astro and the extension once per framework they can host and once without.
const probes = (): E2eCase[] => {
  return TARGET_IDS.flatMap((target) => {
    const hosts = targetFor({
      ...DEFAULT_ANSWERS,
      target,
    }).hostsFramework === true
      ? [undefined, ...HOSTED_FRAMEWORKS]
      : [undefined];

    return hosts.map((hostedFramework) => {
      return {
        label: hostedFramework === undefined ? target : `${target} hosting ${hostedFramework}`,
        answers: maximal(target, hostedFramework),
      };
    });
  });
};

const flagsFor = (answers: Answers, pm: Collected): string[] => {
  return [
    '--target', answers.target,
    '--pm', pm,
    '--testing', answers.testing,
    '--type-safety', answers.typeSafety,
    '--libraries', answers.libraries.join(','),
    '--agents', answers.agents.join(','),
    '--plugins', answers.plugins.join(','),
    ...(answers.target === 'webextension' ? ['--browser', answers.browser] : []),
    ...(answers.hostedFramework === undefined ? [] : ['--hosted', answers.hostedFramework]),
    ...(answers.surfaces === undefined ? [] : ['--surfaces', answers.surfaces.join(',')]),
    ...(answers.form === undefined ? [] : ['--form', answers.form]),
    ...(answers.router === undefined ? [] : ['--router', answers.router]),
    ...(answers.store ? ['--store'] : []),
  ];
};

const run = (command: string, args: string[], cwd: string, registry: E2eRegistry): string => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: {
      ...env,
      npm_config_registry: registry.url,
      NPM_CONFIG_REGISTRY: registry.url,
      pnpm_config_registry: registry.url,
      pnpm_config_minimum_release_age: '0',
      npm_config_cache: join(registry.cacheDir, 'npm'),
      pnpm_config_store_dir: join(registry.cacheDir, 'pnpm-store'),
    },
  });

  return `${result.stdout}${result.stderr}`;
};

const PASSES: Record<Collected, Pass> = {
  pnpm: {
    clear: (project) => {
      const path = join(project, 'pnpm-workspace.yaml');

      writeFileSync(path, readFileSync(path, 'utf8').replace(/^allowBuilds:\n(?: {2}.*\n)*/m, 'allowBuilds: {}\n'));
    },
    install: ['install'],
    list: (project, registry) => {
      const listing = run('pnpm', ['ignored-builds'], project, registry);
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
    // npm 11 warns where npm 12 blocks, and `install-scripts ls` answers either way. `--json` rather than the prose.
    list: (project, registry) => {
      const listing = run(NPM[0], [...NPM[1], 'install-scripts', 'ls', '--json'], project, registry);
      const opening = listing.indexOf('{');

      if (opening === -1) {
        return [];
      }

      // A version without the subcommand answers prose, or nothing; neither is a reason to lose the whole run.
      try {
        const parsed: unknown = JSON.parse(listing.slice(opening));

        return isScriptListing(parsed)
          ? parsed.allowScripts.map((entry) => {
              return entry.name;
            })
          : [];
      }
      catch {
        console.log(`npm install-scripts ls answered no JSON:\n${listing.slice(0, 400)}`);

        return [];
      }
    },
  },
};

const isScriptListing = (value: unknown): value is ScriptListing => {
  return typeof value === 'object'
    && value !== null
    && 'allowScripts' in value
    && Array.isArray(value.allowScripts);
};

// One probe, both managers. Separate from `main` so the reporting below reads as reporting.
const collectFor = (
  { label, answers }: E2eCase,
  workspace: string,
  registry: E2eRegistry,
): Record<Collected, string[]> => {
  const perManager: Record<Collected, string[]> = {
    pnpm: [],
    npm: [],
  };

  for (const pm of ['pnpm', 'npm'] as const) {
    const pass = PASSES[pm];
    const root = join(workspace, `${label.replaceAll(' ', '-')}-${pm}`);
    const name = answers.target === 'react-native' ? 'rn-app' : answers.target;

    mkdirSync(root, { recursive: true });
    // `--no-install`, so the manifests exist before the allowance is stripped out of them.
    const created = run('node', [registry.cliBin, name, ...flagsFor(answers, pm), '--no-install'], root, registry);
    const project = join(root, name);

    try {
      pass.clear(project);
    }
    catch {
      console.log(`${label} on ${pm}: create wrote no manifest\n${created}`);
      continue;
    }

    // pnpm exits 1 on the first ignored build and npm 11 only warns; both are expected here rather than failures.
    const [binary, prefix] = pm === 'npm' ? NPM : [pm, []];

    run(binary, [...prefix, ...pass.install], project, registry);
    perManager[pm] = pass.list(project, registry);
  }

  return perManager;
};

const sorted = (names: Set<string>): string => {
  return [...names].sort((left, right) => {
    return left.localeCompare(right, 'en');
  }).map((name) => {
    return `  '${name}'`;
  }).join('\n');
};

const report = (found: Map<string, Record<Collected, string[]>>): void => {
  const everything = new Set<string>();
  const npmOnly = new Set<string>();

  console.log(`\n  ${'target'.padEnd(28)}${'pnpm'.padEnd(46)}npm only\n`);

  for (const [label, perManager] of found) {
    const extra = perManager.npm.filter((name) => {
      return !perManager.pnpm.includes(name);
    });

    for (const name of [...perManager.pnpm, ...perManager.npm]) {
      everything.add(name);
    }

    for (const name of extra) {
      npmOnly.add(name);
    }

    const names = perManager.pnpm.length === 0 ? '(none)' : perManager.pnpm.join(', ');

    console.log(`  ${label.padEnd(28)}${names.padEnd(46)}${extra.length === 0 ? '-' : extra.join(', ')}`);
  }

  console.log(`\nUnion, for allowBuilds:\n${sorted(everything)}`);
  console.log(`\nBlocked by npm and not by pnpm, which is what NPM_ALLOWED_BUILDS holds:\n${
    npmOnly.size === 0 ? '  (none)' : sorted(npmOnly)}\n`);
};

const main = async (): Promise<void> => {
  const { registry, stop } = await startRegistry();
  const workspace = mkdtempSync(join(tmpdir(), 'linteljs-builds-'));
  const found = new Map<string, Record<Collected, string[]>>();

  try {
    for (const probe of probes()) {
      found.set(probe.label, collectFor(probe, workspace, registry));
    }
  }
  finally {
    stop();
    rmSync(workspace, {
      recursive: true,
      force: true,
    });
  }

  report(found);
};

try {
  await main();
}
catch (error) {
  console.error(error);
  process.exitCode = 1;
}
