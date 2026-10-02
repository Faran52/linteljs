import { join } from 'node:path';
import { env, versions } from 'node:process';

import { NODE_FLOOR } from '@config/constants';

import { entryExists } from '@disk';
import { nodeSpawn, packageManagerSpawn } from '@spawns';

import { LOCKFILES } from './constants';
import {
  type DetectedManager,
  managerFromUserAgent,
  managerRefusal,
  nodeRefusal,
  unversionedRefusal,
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

// The user agent, else the lockfile, else npm, which is what a bare `node .../create` is.
const detectedManager = async (cwd: string): Promise<DetectedManager> => {
  const fromAgent = managerFromUserAgent(env['npm_config_user_agent']);

  if (fromAgent !== undefined) {
    return fromAgent;
  }

  const lookups = LOCKFILES
    .map(async ([lockfile, name]) => {
      const isPresent = await entryExists(join(cwd, lockfile));

      return isPresent ? name : undefined;
    });

  const present = await Promise.all(lookups);

  const found = present
    .find((name) => {
      return name !== undefined;
    }) ?? 'npm';

  const detected: DetectedManager = {
    name: found,
    version: undefined,
  };

  return detected;
};

export const hosted = (answers: Answers, host: Host): HostedAnswers => {
  const withHost: HostedAnswers = {
    ...answers,
    packageManager: host.packageManager,
    packageManagerVersion: host.packageManagerVersion,
    nodeVersion: host.nodeVersion,
  };

  return withHost;
};

// The version fills only where the two agree on the manager.
export const filled = (answers: Answers, host: Host): HostedAnswers => {
  const sameManager = answers.packageManager === host.packageManager;

  const completed: HostedAnswers = {
    ...answers,
    ...answers.packageManagerVersion === undefined && sameManager
      ? { packageManagerVersion: host.packageManagerVersion }
      : {},
    nodeVersion: answers.nodeVersion ?? host.nodeVersion,
  };

  return completed;
};

// Answered rather than thrown, and asked before the questionnaire.
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

  // bun's `versions.node` is the Node it bundles, not the one a project runs on.
  const nodeVersion = versions['bun'] === undefined ? versions.node : nodeSpawn();

  if (nodeVersion === undefined) {
    return 'bun ran this, and the project it writes runs on Node. '
      + `Install Node ${NODE_FLOOR} or newer and run this again.`;
  }

  const host: Host = {
    packageManager: manager.name,
    packageManagerVersion,
    nodeVersion,
  };

  return nodeRefusal(nodeVersion) ?? host;
};
