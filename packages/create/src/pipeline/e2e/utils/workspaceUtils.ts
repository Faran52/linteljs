import {
  mkdirSync,
  mkdtempSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { MANAGER_BINARIES, MANAGER_FLOORS } from '@config/constants';

import { PACKAGE_MANAGERS } from '../matrix/constants';

import {
  oneAtATime,
  registry,
  run,
  runPm,
  type RunResult,
} from './processUtils';

import type { Answers, PackageManager } from '@config/types';

export const workspace = mkdtempSync(join(tmpdir(), 'linteljs-e2e-'));

export const afterAllCleanup = (): void => {
  rmSync(workspace, {
    recursive: true,
    force: true,
  });
};

// What a manager sets when it launches the CLI itself. The binary rather than the id: both yarns say `yarn/<version>`.
const agentOf = (pm: PackageManager, version: string): string => {
  return `${MANAGER_BINARIES[pm]}/${version} npm/? node/? e2e`;
};

/**
 * The version in what `<binary> --version` answered, refused unless the CLI would read it back as `pm`. Both yarns
 * answer to `yarn` and the CLI tells them apart by major, so a case run on the other one would record the wrong
 * manager and assert against the right one.
 */
export const versionFrom = (pm: PackageManager, output: string): string => {
  // The first line: npm appends a new-version notice on stderr, which `run` joins after stdout.
  const [version = ''] = output
    .trim()
    .split('\n');

  // `x.y.z` or nothing: a manager missing from this machine answers with its spawn error, and injecting that as a
  // version is a failure three stages further on.
  if (version.split('.').length !== 3) {
    throw new Error(`${pm} --version answered ${output}`);
  }

  if (MANAGER_BINARIES[pm] === 'yarn' && version.startsWith('1.') !== (pm === 'yarn-classic')) {
    throw new Error(`The ${MANAGER_BINARIES[pm]} on PATH is ${version}, which cannot run the ${pm} cases: put one `
      + `at ${MANAGER_FLOORS[pm]} or above, of the same major, first on PATH.`);
  }

  return version;
};

const readVersion = async (pm: PackageManager): Promise<string> => {
  return versionFrom(pm, (await runPm(pm, ['--version'], workspace)).output);
};

// The version the manager would have written into its own user agent, read once per manager. The promise is what is
// cached rather than the version: the cases in a file run together, so two misses would otherwise both spawn.
const versions = new Map<PackageManager, Promise<string>>();

export const versionOf = async (pm: PackageManager): Promise<string> => {
  const pending = versions.get(pm) ?? readVersion(pm);

  versions.set(pm, pending);

  return pending;
};

// The answers as a person would type them; a flag a target never asks for is refused, so those go only when set.
// The manager is not among them: it is read from the user agent, which is what `createProject` injects.
export const answerFlags = (answers: Answers): string[] => {
  return [
    '--target', answers.target,
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
    ...(answers.store === undefined ? [] : ['--store', answers.store]),
    ...(answers.styling === undefined ? [] : ['--styling', answers.styling]),
    ...(answers.data === undefined ? [] : ['--data', answers.data]),
    ...(answers.mocking === undefined ? [] : ['--mocking', answers.mocking]),
  ];
};

// One command from an empty parent directory, which is the whole of what a user does.
export const createProject = async (root: string, name: string, answers: Answers): Promise<RunResult> => {
  mkdirSync(root, { recursive: true });

  const pm = answers.packageManager;
  // Injected, because no flag names a manager: the agent is the only way a case says which one it is.
  const agent = agentOf(pm, await versionOf(pm));

  return oneAtATime(pm, async () => {
    return run('node', [registry.cliBin, name, ...answerFlags(answers)], root, agent);
  });
};

/**
 * The managers a run tests. `E2E_PM` names one, as each job in `e2e.yml` does, and its version is read here so a
 * missing binary or the wrong yarn fails the run once rather than every case. Unset, every manager this machine
 * answers for: both yarns answer to `yarn`, so no one machine carries all five, and a local run tests what it has.
 */
export const managersToRun = async (requested: string | undefined): Promise<PackageManager[]> => {
  if (requested === undefined) {
    const read = await Promise.allSettled(PACKAGE_MANAGERS.map(versionOf));

    return PACKAGE_MANAGERS
      .filter((_pm, index) => {
        return read[index]?.status === 'fulfilled';
      });
  }

  const pm = PACKAGE_MANAGERS
    .find((manager) => {
      return manager === requested;
    });

  if (pm === undefined) {
    throw new Error(`E2E_PM is ${requested}, and is one of ${PACKAGE_MANAGERS.join(', ')} or unset`);
  }

  await versionOf(pm);

  return [pm];
};
