import { join } from 'node:path';
import { env, versions } from 'node:process';

import { NODE_FLOOR } from '@config/constants';

import { entryExists, readIfPresent } from '@disk';
import { nodeSpawn, packageManagerSpawn } from '@spawns';

import { LOCKFILES } from './constants';
import {
  type DetectedManager,
  managerFromUserAgent,
  managerRefusal,
  nodeRefusal,
  unversionedRefusal,
  yarnFromLockfile,
} from './utils/hostUtils';

import type {
  Answers,
  HostedAnswers,
  PackageManager,
} from '@config/types';

export interface Host {
  packageManager: PackageManager;
  packageManagerVersion: string;
  nodeVersion: string;
}

// The manager that invoked this CLI, which is the one a generated project keeps: the user agent that manager sets,
// else the lockfile the directory already has, else npm, which is what a bare `node .../create` is.
const detectedManager = async (cwd: string): Promise<DetectedManager> => {
  const fromAgent = managerFromUserAgent(env['npm_config_user_agent']);

  if (fromAgent !== undefined) {
    return fromAgent;
  }

  const lookups = LOCKFILES
    .map(async ([lockfile, name]) => {
      return await entryExists(join(cwd, lockfile)) ? name : undefined;
    });

  const present = await Promise.all(lookups);

  const found = present
    .find((name) => {
      return name !== undefined;
    }) ?? 'npm';

  return {
    // `yarn.lock` names yarn without saying which one, and the two are different managers here.
    name: found === 'yarn' ? yarnFromLockfile(await readIfPresent(join(cwd, 'yarn.lock'))) : found,
    version: undefined,
  };
};

// A fresh run records the host: `packageManager` on the answers is a placeholder until here.
export const hosted = (answers: Answers, host: Host): HostedAnswers => {
  return {
    ...answers,
    packageManager: host.packageManager,
    packageManagerVersion: host.packageManagerVersion,
    nodeVersion: host.nodeVersion,
  };
};

/**
 * A config already recorded a manager, so it wins and the host fills only what a config written before these were
 * recorded lacks. The version fills only where the two agree on the manager: this machine's pnpm version says
 * nothing about a project that records npm, and `packageManager` would then name a version that manager never had.
 */
export const filled = (answers: Answers, host: Host): HostedAnswers => {
  const sameManager = answers.packageManager === host.packageManager;

  return {
    ...answers,
    ...answers.packageManagerVersion === undefined && sameManager
      ? { packageManagerVersion: host.packageManagerVersion }
      : {},
    nodeVersion: answers.nodeVersion ?? host.nodeVersion,
  };
};

/**
 * The machine this run records, or the one sentence that stops it: the manager that invoked the CLI has to be one a
 * project of ours can be installed by, and the Node a generated project will run on has to be one this CLI can write
 * for. Answered rather than thrown, like `argumentError`, and asked before the questionnaire.
 */
export const hostOf = async (cwd: string): Promise<Host | string> => {
  const manager = await detectedManager(cwd);
  const packageManagerVersion = manager.version ?? packageManagerSpawn(manager.name);

  if (packageManagerVersion === undefined) {
    return unversionedRefusal(manager.name);
  }

  const wrongManager = managerRefusal(manager.name, packageManagerVersion);

  if (wrongManager !== undefined) {
    return wrongManager;
  }

  // bun runs this CLI itself, so `versions.node` there is the Node bun bundles rather than the one a project runs on.
  const nodeVersion = versions['bun'] === undefined ? versions.node : nodeSpawn();

  if (nodeVersion === undefined) {
    return 'bun ran this, and the project it writes runs on Node. '
      + `Install Node ${NODE_FLOOR} or newer and run this again.`;
  }

  return nodeRefusal(nodeVersion) ?? {
    packageManager: manager.name,
    packageManagerVersion,
    nodeVersion,
  };
};
