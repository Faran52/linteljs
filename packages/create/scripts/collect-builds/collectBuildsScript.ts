// Run after a dependency bump: pnpm aborts on an unlisted `postinstall`.
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process, { env, execPath } from 'node:process';

import { Semaphore } from 'es-toolkit';

import { type E2eRegistry, startRegistry } from '@e2e/registry/registry';

import {
  log,
  logError,
  logWarn,
} from '../../templates/project/scripts/utils/loggerUtils.ts';

import {
  caseLayout,
  concurrencyFrom,
  createArgs,
  userAgent,
} from './utils/caseUtils.ts';
import {
  type Collected,
  installCommand,
  PASSES,
  run,
} from './utils/passesUtils.ts';
import { probes } from './utils/probesUtils.ts';
import { type Found, reportLines } from './utils/reportUtils.ts';

import type { E2eCase } from '@e2e/matrix/matrix';

const MANAGERS: Collected[] = ['pnpm', 'npm'];
const CONCURRENCY = concurrencyFrom(env['COLLECT_CONCURRENCY']);

const collectOne = async (
  probe: E2eCase,
  pm: Collected,
  workspace: string,
  registry: E2eRegistry,
  agent: string,
): Promise<string[]> => {
  const {
    root,
    name,
    project,
  } = caseLayout(probe, pm, workspace);

  mkdirSync(root, { recursive: true });

  const created = await run(execPath, createArgs(registry.cliBin, name, probe.answers), root, registry, agent);

  try {
    PASSES[pm].clear(project);
  }
  catch {
    logWarn(`${probe.label} on ${pm}: create wrote no manifest\n${created}`);

    return [];
  }

  // pnpm exits 1 on the first ignored build and npm 11 only warns, so the exit code is no verdict.
  const [binary, args] = installCommand(pm);

  await run(binary, args, project, registry);

  return await PASSES[pm].list(project, registry);
};

const main = async (): Promise<void> => {
  const { registry, stop } = await startRegistry();
  const workspacePrefix = join(tmpdir(), 'linteljs-builds-');
  const workspace = mkdtempSync(workspacePrefix);
  const semaphore = new Semaphore(CONCURRENCY);

  try {
    const agentLookups = MANAGERS
      .map(async (pm): Promise<[Collected, string]> => {
        const versionOutput = await run(pm, ['--version'], workspace, registry);
        const agent: [Collected, string] = [pm, userAgent(pm, versionOutput)];

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
        }] satisfies Found[number];

        return entry;
      });

    const found = await Promise.all(collections);

    for (const line of reportLines(found)) {
      log(line);
    }
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
