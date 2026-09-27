/**
 * Every build script a generated project can meet, in one pass. pnpm aborts on an unlisted `postinstall`, and
 * `vue-demi` surfaced as combination 1,187 of 1,200 in the end-to-end matrix. This installs each target's maximal
 * dependency set with `allowBuilds` emptied and prints what belongs in the record or `SHARED_ALLOWED_BUILDS`.
 * Eighteen real installs per manager, so run it after a dependency bump.
 *
 * Usage: pnpm --filter @linteljs/create collect:builds   (COLLECT_CONCURRENCY, default 4)
 */
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process, { env, execPath } from 'node:process';

import { Semaphore } from 'es-toolkit';

import { type E2eRegistry, startRegistry } from '../../src/pipeline/e2e/registry/registry';
import { answerFlags } from '../../src/pipeline/e2e/utils/workspaceUtils';
import {
  log,
  logError,
  logWarn,
} from '../../templates/project/scripts/utils/loggerUtils.ts';

import {
  type Collected,
  NPM,
  PASSES,
  run,
} from './utils/passesUtils.ts';
import { probes } from './utils/probesUtils.ts';

import type { E2eCase } from '../../src/pipeline/e2e/matrix/matrix';

const MANAGERS: Collected[] = ['pnpm', 'npm'];
const CONCURRENCY = Number(env['COLLECT_CONCURRENCY'] ?? 4);

const collectOne = async (
  { label, answers }: E2eCase,
  pm: Collected,
  workspace: string,
  registry: E2eRegistry,
  agent: string,
): Promise<string[]> => {
  const root = join(workspace, `${label.replaceAll(' ', '-')}-${pm}`);
  const name = answers.target === 'react-native' ? 'rn-app' : answers.target;
  const project = join(root, name);

  mkdirSync(root, { recursive: true });

  // `--no-install`, so the manifests exist before the allowance is stripped out of them.
  const flags = [registry.cliBin, name, ...answerFlags(answers), '--no-install'];
  const created = await run(execPath, flags, root, registry, agent);

  try {
    PASSES[pm].clear(project);
  }
  catch {
    logWarn(`${label} on ${pm}: create wrote no manifest\n${created}`);

    return [];
  }

  // pnpm exits 1 on the first ignored build and npm 11 only warns, so the exit code is not a verdict here.
  const [binary, prefix] = pm === 'npm' ? NPM : [pm, []];

  await run(binary, [...prefix, ...PASSES[pm].install], project, registry);

  return await PASSES[pm].list(project, registry);
};

const sorted = (names: Iterable<string>): string => {
  const list = [...new Set(names)].sort((left, right) => {
    return left.localeCompare(right, 'en');
  });

  return list.length === 0
    ? '  (none)'
    : list.map((name) => {
        return `  '${name}'`;
      }).join('\n');
};

const report = (found: [string, Record<Collected, string[]>][]): void => {
  const rows = found.map(([label, { pnpm, npm }]) => {
    const extra = npm.filter((name) => {
      return !pnpm.includes(name);
    });

    return {
      label,
      pnpm,
      extra,
    };
  });

  log([
    `  ${'target'.padEnd(28)}${'pnpm'.padEnd(46)}npm only`,
    ...rows.map(({
      label,
      pnpm,
      extra,
    }) => {
      return `  ${label.padEnd(28)}${(pnpm.join(', ') || '(none)').padEnd(46)}${extra.join(', ') || '-'}`;
    }),
  ].join('\n'));
  log(`Union, for allowBuilds:\n${sorted(found.flatMap(([, { pnpm, npm }]) => {
    return [...pnpm, ...npm];
  }))}`);
  log(`Blocked by npm and not by pnpm, which is what NPM_ALLOWED_BUILDS holds:\n${sorted(rows.flatMap(({ extra }) => {
    return extra;
  }))}`);
};

const main = async (): Promise<void> => {
  const { registry, stop } = await startRegistry();
  const workspace = mkdtempSync(join(tmpdir(), 'linteljs-builds-'));
  const semaphore = new Semaphore(CONCURRENCY);

  try {
    // The CLI reads its manager from `npm_config_user_agent`, so a pass names one the way a real run does.
    const agents = new Map(await Promise.all(MANAGERS.map(async (pm): Promise<[Collected, string]> => {
      const version = (await run(pm, ['--version'], workspace, registry)).trim();

      return [pm, `${pm}/${version} npm/? node/? collect`];
    })));

    const found = await Promise.all(probes().map(async (probe) => {
      const [pnpm, npm] = await Promise.all(MANAGERS.map(async (pm) => {
        await semaphore.acquire();

        try {
          return await collectOne(probe, pm, workspace, registry, agents.get(pm) ?? pm);
        }
        finally {
          semaphore.release();
        }
      }));

      return [probe.label, {
        pnpm: pnpm ?? [],
        npm: npm ?? [],
      }] satisfies [string, Record<Collected, string[]>];
    }));

    report(found);
  }
  finally {
    stop();
    rmSync(workspace, {
      recursive: true,
      force: true,
    });
  }
};

try {
  await main();
}
catch (error) {
  logError('collecting build scripts failed', error instanceof Error ? error : undefined);
  process.exitCode = 1;
}
