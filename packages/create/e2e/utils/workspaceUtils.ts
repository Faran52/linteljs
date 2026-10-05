import { mkdirSync, mkdtempSync } from 'node:fs';

import { MANAGER_FLOORS } from '@config/constants';

import { VERSION_PARTS, WORKSPACE_PREFIX } from '../constants';
import { PACKAGE_MANAGERS } from '../matrix/constants';

import { removeDir } from './cleanupUtils';
import {
  oneAtATime,
  registry,
  run,
  runPm,
  type RunResult,
} from './processUtils';

import type { Answers, PackageManager } from '@config/types';

export const workspace = mkdtempSync(WORKSPACE_PREFIX);

export const afterAllCleanup = async (): Promise<void> => {
  await removeDir(workspace);
};

const agentOf = (pm: PackageManager, version: string): string => {
  return `${pm}/${version} npm/? node/? e2e`;
};

const versionFrom = (pm: PackageManager, output: string): string => {
  // The first line: npm appends a new-version notice on stderr.
  const [version = ''] = output
    .trim()
    .split('\n');

  // A missing manager answers with its spawn error, which as a version fails three stages later.
  if (version.split('.').length !== VERSION_PARTS) {
    throw new Error(`${pm} --version answered ${output}`);
  }

  if (pm === 'yarn' && version.startsWith('1.')) {
    throw new Error(`The yarn on PATH is ${version}, which cannot run the yarn cases: put one `
      + `at ${MANAGER_FLOORS[pm]} or above first on PATH.`);
  }

  return version;
};

const readVersion = async (pm: PackageManager): Promise<string> => {
  const printed = await runPm(pm, ['--version'], workspace);

  return versionFrom(pm, printed.output);
};

// The promise is cached: the cases in a file run together, so two misses would both spawn.
const versions = new Map<PackageManager, Promise<string>>();

export const versionOf = async (pm: PackageManager): Promise<string> => {
  const pending = versions.get(pm) ?? readVersion(pm);

  versions.set(pm, pending);

  return pending;
};

// A flag a target never asks for is refused, so those go only when set.
export const answerFlags = (answers: Answers): string[] => {
  const flags = [
    '--target',
    answers.target,
    '--testing',
    answers.testing,
    '--type-safety',
    answers.typeSafety,
    '--libraries',
    answers.libraries.join(','),
    '--agents',
    answers.agents.join(','),
    '--plugins',
    answers.plugins.join(','),
    ...(answers.target === 'webextension' ? ['--browser', answers.browser] : []),
    ...(answers.hostedFramework === undefined ? [] : ['--hosted', answers.hostedFramework]),
    ...(answers.surfaces === undefined ? [] : ['--surfaces', answers.surfaces.join(',')]),
    ...(answers.form === undefined ? [] : ['--form', answers.form]),
    ...(answers.router === undefined ? [] : ['--router', answers.router]),
    ...(answers.store === undefined ? [] : ['--store', answers.store]),
    ...(answers.styling === undefined ? [] : ['--styling', answers.styling]),
    ...(answers.data === undefined ? [] : ['--data', answers.data]),
    ...(answers.mocking === undefined ? [] : ['--mocking', answers.mocking]),
    ...(answers.languages === undefined ? [] : ['--languages', answers.languages.join(',')]),
  ];

  return flags;
};

export const createProject = async (
  root: string,
  name: string,
  answers: Answers,
  flags: readonly string[] = [],
): Promise<RunResult> => {
  mkdirSync(root, { recursive: true });

  const pm = answers.packageManager;
  const version = await versionOf(pm);
  // Injected, because no flag names a manager.
  const agent = agentOf(pm, version);

  return oneAtATime(pm, async () => {
    return run('node', [
      registry.cliBin,
      name,
      ...answerFlags(answers),
      ...flags,
    ], root, agent);
  });
};

// A machine without a manager runs the rest.
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

  const managers = [pm];

  return managers;
};
