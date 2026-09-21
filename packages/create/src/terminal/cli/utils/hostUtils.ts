import {
  MANAGER_BINARIES,
  MANAGER_FLOORS,
  NODE_FLOOR,
} from '@config/constants';

import { valuesOf } from '@utils/objectUtils';
import { majorOf, rankOf } from '@utils/versionUtils';

import type { PackageManager } from '@answers';

export interface DetectedManager {
  name: PackageManager;
  version: string | undefined;
}

// What an agent's first token can say, which is a command rather than an id: derived, so a sixth manager is one row.
const AGENT_NAMES = new Set<string>(valuesOf(MANAGER_BINARIES));

// Yarn says `yarn` whichever yarn it is, and the two are different managers here, so the major decides. An agent
// with no version to read is taken for Berry: that is the yarn a fresh project gets, and the one a `dlx` forwards to.
const managerNamed = (name: string, version: string | undefined): PackageManager => {
  return name === 'yarn' && version !== undefined && majorOf(version) === 1 ? 'yarn-classic' : name as PackageManager;
};

/**
 * The first token of `npm_config_user_agent`, read the way every scaffolder reads it:
 * `pnpm/12.5.1 npm/? node/? darwin arm64`. A name outside the four commands answers `undefined`, as does an unset
 * agent, and so does a version that is not one: pnpm's own agent carries `node/?` rather than a Node version.
 */
export const managerFromUserAgent = (userAgent: string | undefined): DetectedManager | undefined => {
  const [token = ''] = (userAgent ?? '').split(' ');
  const [name = '', version = ''] = token.split('/');

  if (!AGENT_NAMES.has(name)) {
    return undefined;
  }

  const read = /^\d+\.\d+\.\d+$/u.test(version) ? version : undefined;

  return {
    name: managerNamed(name, read),
    version: read,
  };
};

// Both yarns write `yarn.lock`, so the file decides. Classic opens with its own banner; Berry's carries `__metadata`.
// Anything unreadable or unfamiliar is taken for Berry, which is what a project made here would have.
export const yarnFromLockfile = (text: string | null): PackageManager => {
  return text?.includes('# yarn lockfile v1') === true ? 'yarn-classic' : 'yarn';
};

// At or above the floor a generated project's own files need. Refused below rather than installed.
export const acceptsManager = (pm: PackageManager, version: string): boolean => {
  return rankOf(version) >= rankOf(MANAGER_FLOORS[pm]);
};

// Why this run cannot go on, or `undefined`. Answered rather than thrown, like `argumentError` beside it, because it
// runs before the questionnaire: nobody should answer a dozen questions and then be told their manager is too old.
export const managerRefusal = (pm: PackageManager, version: string | undefined): string | undefined => {
  if (version === undefined) {
    return `${pm} ran this, but \`${pm} --version\` answers nothing. Install it and run this again.`;
  }

  if (acceptsManager(pm, version)) {
    return undefined;
  }

  // The command rather than the id: `yarn-classic` is not something anyone can type or install.
  const binary = MANAGER_BINARIES[pm];

  return `${binary} ${version} ran this, and a project this CLI writes needs ${binary} ${MANAGER_FLOORS[pm]} or `
    + 'newer. Upgrade it and run this again.';
};

// The floor this CLI runs on, which is where `--experimental-strip-types` first exists, rather than the `>=22` a
// generated project declares: the two shipped `scripts/*.ts` run under that flag.
export const nodeRefusal = (running: string): string | undefined => {
  return rankOf(running) < rankOf(NODE_FLOOR)
    ? `Node ${running} is running this, and @linteljs/create needs Node ${NODE_FLOOR} or newer. `
    + 'Install it from https://nodejs.org and run this again.'
    : undefined;
};
