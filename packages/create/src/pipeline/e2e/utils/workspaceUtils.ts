import {
  mkdirSync,
  mkdtempSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  registry,
  run,
  runPm,
  type RunResult,
} from './processUtils';

import type { Answers, PackageManager } from '@answers';

// The one failure worth retrying: a scaffolder pins the version it just saw, and `create astro` once asked for a
// version 33 seconds before it was published. Matched on the error code, since any other failure is real.
const UNPUBLISHED_YET_BY_PM: Record<PackageManager, string[]> = {
  pnpm: ['ERR_PNPM_NO_MATCHING_VERSION'],
  npm: ['npm ERR! code E404', 'npm ERR! 404 Not Found'],
  yarn: ['YN0027'],
  bun: ['error:'],
};

const isUnpublishedYet = (pm: PackageManager, output: string): boolean => {
  return UNPUBLISHED_YET_BY_PM[pm].some((code) => {
    return output.includes(code);
  });
};

export const workspace = mkdtempSync(join(tmpdir(), 'linteljs-e2e-'));

export const afterAllCleanup = (): void => {
  rmSync(workspace, {
    recursive: true,
    force: true,
  });
};

const readVersion = async (pm: PackageManager): Promise<string> => {
  const { output } = await runPm(pm, ['--version'], workspace);
  // The first line: npm appends a new-version notice on stderr, which `run` joins after stdout.
  const [version = ''] = output.trim().split('\n');

  // `x.y.z` or nothing: a manager missing from this machine answers with its spawn error, and injecting that as a
  // version is a failure three stages further on.
  if (version.split('.').length !== 3) {
    throw new Error(`${pm} --version answered ${output}`);
  }

  return version;
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
    ...(answers.store ? ['--store'] : []),
  ];
};

// One command from an empty parent directory, which is the whole of what a user does.
export const createProject = async (root: string, name: string, answers: Answers): Promise<RunResult> => {
  mkdirSync(root, { recursive: true });

  const pm = answers.packageManager;
  // Exactly what the manager sets when it launches the CLI itself: its own name and version, first token, split on
  // `/`. Injecting it is what keeps four managers four managers now that no flag names one.
  const agent = `${pm}/${await versionOf(pm)} npm/? node/? e2e`;

  const attempt = async (): Promise<RunResult> => {
    rmSync(join(root, name), {
      recursive: true,
      force: true,
    });

    return run('node', [registry.cliBin, name, ...answerFlags(answers)], root, agent);
  };

  const first = await attempt();

  return first.status === 0 || !isUnpublishedYet(answers.packageManager, first.output) ? first : attempt();
};
