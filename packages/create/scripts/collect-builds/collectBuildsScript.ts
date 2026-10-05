// Run after a dependency bump: pnpm aborts on an unlisted `postinstall`.
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process, { env, execPath } from 'node:process';

import {
  difference,
  Semaphore,
  uniq,
} from 'es-toolkit';

import { type E2eRegistry, startRegistry } from '@e2e/registry/registry';
import { answerFlags } from '@e2e/utils/workspaceUtils';

import {
  log,
  logError,
  logWarn,
} from '../../templates/project/scripts/utils/loggerUtils.ts';

import { COLUMN_WIDTH, DEFAULT_CONCURRENCY } from './constants.ts';
import {
  type Collected,
  NPM,
  PASSES,
  run,
} from './utils/passesUtils.ts';
import { probes } from './utils/probesUtils.ts';

import type { E2eCase } from '@e2e/matrix/matrix';

const MANAGERS: Collected[] = ['pnpm', 'npm'];
const CONCURRENCY = Number(env['COLLECT_CONCURRENCY'] ?? DEFAULT_CONCURRENCY);

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

  // `--no-install`, so the manifests exist before the allowance is stripped.
  const flags = [
    registry.cliBin,
    name,
    ...answerFlags(answers),
    '--no-install',
  ];
  const created = await run(execPath, flags, root, registry, agent);

  try {
    PASSES[pm].clear(project);
  }
  catch {
    logWarn(`${label} on ${pm}: create wrote no manifest\n${created}`);

    return [];
  }

  // pnpm exits 1 on the first ignored build and npm 11 only warns, so the exit code is no verdict.
  const [binary, prefix] = pm === 'npm' ? NPM : [pm, []];

  await run(binary, [...prefix, ...PASSES[pm].install], project, registry);

  return await PASSES[pm].list(project, registry);
};

const sorted = (names: string[]): string => {
  const list = uniq(names)
    .toSorted((left, right) => {
      return left.localeCompare(right, 'en');
    });

  return list.length === 0
    ? '  (none)'
    : list
        .map((name) => {
          return `  '${name}'`;
        })
        .join('\n');
};

const report = (found: [string, Record<Collected, string[]>][]): void => {
  const rows = found
    .map(([label, { pnpm, npm }]) => {
      const extra = difference(npm, pnpm);

      const row = {
        label,
        pnpm,
        extra,
      };

      return row;
    });

  const table = [
    `  ${'target'.padEnd(COLUMN_WIDTH.target)}${'pnpm'.padEnd(COLUMN_WIDTH.pnpm)}npm only`,
    ...rows
      .map(({
        label,
        pnpm,
        extra,
      }) => {
        return `  ${label.padEnd(COLUMN_WIDTH.target)}${(pnpm.join(', ') || '(none)').padEnd(COLUMN_WIDTH.pnpm)}`
          + (extra.join(', ') || '-');
      }),
  ].join('\n');

  log(table);

  const union = sorted(found
    .flatMap(([, { pnpm, npm }]) => {
      return pnpm.concat(npm);
    }));

  log(`Union, for allowBuilds:\n${union}`);

  const npmOnly = sorted(rows
    .flatMap(({ extra }) => {
      return extra;
    }));

  log(`Blocked by npm and not by pnpm, which is what NPM_ALLOWED_BUILDS holds:\n${npmOnly}`);
};

const main = async (): Promise<void> => {
  const { registry, stop } = await startRegistry();
  const workspacePrefix = join(tmpdir(), 'linteljs-builds-');
  const workspace = mkdtempSync(workspacePrefix);
  const semaphore = new Semaphore(CONCURRENCY);

  try {
    // The CLI reads its manager from `npm_config_user_agent`.
    const agentLookups = MANAGERS
      .map(async (pm): Promise<[Collected, string]> => {
        const versionOutput = await run(pm, ['--version'], workspace, registry);
        const version = versionOutput.trim();
        const agent: [Collected, string] = [pm, `${pm}/${version} npm/? node/? collect`];

        return agent;
      });

    const agentList = await Promise.all(agentLookups);
    const agents = new Map(agentList);

    const collections = probes()
      .map(async (probe) => {
        const collected = MANAGERS
          .map(async (pm) => {
            await semaphore.acquire();

            try {
              return await collectOne(probe, pm, workspace, registry, agents.get(pm) ?? pm);
            }
            finally {
              semaphore.release();
            }
          });

        const [pnpm, npm] = await Promise.all(collected);

        const entry = [probe.label, {
          pnpm: pnpm ?? [],
          npm: npm ?? [],
        }] satisfies [string, Record<Collected, string[]>];

        return entry;
      });

    const found = await Promise.all(collections);

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
