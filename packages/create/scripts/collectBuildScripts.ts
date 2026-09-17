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
  AGENTS,
  type Answers,
  DEFAULT_ANSWERS,
  HOSTED_FRAMEWORKS,
  type HostedFramework,
  LIBRARIES,
  PLUGINS,
  SURFACES,
  TARGET_IDS,
  type TargetId,
} from '../src/model/answers/answers';
import { targetFor } from '../src/model/targets';
import { startRegistry } from '../src/run/pipeline/e2e/registrySetup';

import type { E2eRegistry } from '../src/run/pipeline/e2e/registrySetup';

interface Probe {
  label: string;
  answers: Answers;
}

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
const probes = (): Probe[] => {
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

const flagsFor = (answers: Answers): string[] => {
  return [
    '--target', answers.target,
    '--pm', 'pnpm',
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
      pnpm_config_registry: registry.url,
      pnpm_config_minimum_release_age: '0',
      pnpm_config_store_dir: join(registry.cacheDir, 'pnpm-store'),
    },
  });

  return `${result.stdout}${result.stderr}`;
};

// `allowBuilds` emptied, so pnpm reports every package that wanted a script rather than the first unlisted one.
const clearAllowBuilds = (project: string): void => {
  const path = join(project, 'pnpm-workspace.yaml');
  const text = readFileSync(path, 'utf8');

  writeFileSync(path, text.replace(/^allowBuilds:\n(?: {2}.*\n)*/m, 'allowBuilds: {}\n'));
};

// `pnpm ignored-builds` reads the installed tree, so it still answers after the install exited 1, which it will.
const ignoredBuilds = (project: string, registry: E2eRegistry): string[] => {
  const listing = run('pnpm', ['ignored-builds'], project, registry);
  const names = /Automatically ignored builds during installation:\n((?: {2}\S+\n)+)/.exec(listing)?.[1];

  return names === undefined
    ? []
    : names.trim().split('\n').map((line) => {
        return line.trim();
      });
};

const main = async (): Promise<void> => {
  const { registry, stop } = await startRegistry();
  const workspace = mkdtempSync(join(tmpdir(), 'lintel-builds-'));
  const found = new Map<string, string[]>();

  try {
    for (const { label, answers } of probes()) {
      const root = join(workspace, label.replaceAll(' ', '-'));
      const name = answers.target === 'react-native' ? 'rn-app' : answers.target;

      mkdirSync(root, { recursive: true });
      // `--no-install`, so the manifests exist before the allowance is stripped out of them.
      const created = run('node', [registry.cliBin, name, ...flagsFor(answers), '--no-install'], root, registry);
      const project = join(root, name);

      try {
        clearAllowBuilds(project);
      }
      catch {
        console.log(`${label}: create wrote no workspace file\n${created}`);
        continue;
      }

      // Exits 1 on the first ignored build, which is the expected outcome here rather than a failure.
      run('pnpm', ['install'], project, registry);
      found.set(label, ignoredBuilds(project, registry));
    }
  }
  finally {
    stop();
    rmSync(workspace, {
      recursive: true,
      force: true,
    });
  }

  const everything = new Set<string>();

  console.log('\nBuild scripts by target\n');

  for (const [label, names] of found) {
    for (const name of names) {
      everything.add(name);
    }

    console.log(`  ${label.padEnd(28)} ${names.length === 0 ? '(none)' : names.join(', ')}`);
  }

  console.log(`\nUnion, for allowBuilds:\n${[...everything].sort((left, right) => {
    return left.localeCompare(right, 'en');
  }).map((name) => {
    return `  '${name}': true`;
  }).join('\n')}\n`);
};

try {
  await main();
}
catch (error) {
  console.error(error);
  process.exitCode = 1;
}
