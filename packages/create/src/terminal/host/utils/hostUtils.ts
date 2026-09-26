import {
  MANAGER_BINARIES,
  MANAGER_FLOORS,
  NODE_FLOOR,
} from '@config/constants';

import { isValueOf } from '@utils/objectUtils';
import { rankOf } from '@utils/versionUtils';

import type { PackageManager } from '@answers';

export interface DetectedManager {
  name: PackageManager;
  version: string | undefined;
}

// What an agent's first token can say, which is a command rather than an id: an id that is its own command, so
// `yarn-classic` is refused and a sixth manager is one row.
const isAgentName = (name: string): name is PackageManager => {
  return isValueOf(name, MANAGER_BINARIES) && MANAGER_BINARIES[name] === name;
};

/**
 * The first token of `npm_config_user_agent`, read the way every scaffolder reads it:
 * `pnpm/12.5.1 npm/? node/? darwin arm64`. A name outside the four commands answers `undefined`, as does an unset
 * agent, and so does a version that is not one: pnpm's own agent carries `node/?` rather than a Node version.
 */
export const managerFromUserAgent = (userAgent: string | undefined): DetectedManager | undefined => {
  if (userAgent === undefined) {
    return undefined;
  }

  // Cut off rather than split, so each piece is a string and never a missing element.
  const token = userAgent.replace(/ .*/su, '');
  const name = token.replace(/\/.*/su, '');

  if (!isAgentName(name)) {
    return undefined;
  }

  const version = token.slice(name.length + 1).replace(/\/.*/su, '');

  /*
   * Yarn says `yarn` whichever yarn it is, and the two are different managers here, so the major decides: semver has
   * no leading zeros, so major 1 is a version opening `1.`. An agent with no version to read is taken for Berry, the
   * yarn a fresh project gets and the one a `dlx` forwards to.
   */
  return {
    name: name === 'yarn' && /^1\.\d+\.\d+$/u.test(version) ? 'yarn-classic' : name,
    version: /^\d+\.\d+\.\d+$/u.test(version) ? version : undefined,
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

// A manager that named itself but will not say its version. A refusal like `managerRefusal`, and asked first, so the
// version that one reads is always a real one.
export const unversionedRefusal = (pm: PackageManager): string => {
  return `${pm} ran this, but \`${pm} --version\` answers nothing. Install it and run this again.`;
};

// Why this run cannot go on, or `undefined`. Answered rather than thrown, like `argumentError`, because it
// runs before the questionnaire: nobody should answer a dozen questions and then be told their manager is too old.
export const managerRefusal = (pm: PackageManager, version: string): string | undefined => {
  if (acceptsManager(pm, version)) {
    return undefined;
  }

  // The command rather than the id: `yarn-classic` is not something anyone can type or install.
  const binary = MANAGER_BINARIES[pm];

  return `${binary} ${version} ran this, and a project this CLI writes needs ${binary} ${MANAGER_FLOORS[pm]} or `
    + 'newer. Upgrade it and run this again.';
};

// The floor this CLI runs on, which is what its own prompt library supports, rather than the `>=22.18` a generated
// project declares. `NODE_FLOOR` carries why the two differ.
export const nodeRefusal = (running: string): string | undefined => {
  return rankOf(running) < rankOf(NODE_FLOOR)
    ? `Node ${running} is running this, and @linteljs/create needs Node ${NODE_FLOOR} or newer. `
    + 'Install it from https://nodejs.org and run this again.'
    : undefined;
};
