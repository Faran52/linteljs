import {
  MANAGER_BINARIES,
  MANAGER_FLOORS,
  NODE_FLOOR,
} from '@config/constants';

import { isValueOf } from '@utils/objectUtils';
import { rankOf } from '@utils/versionUtils';

import type { PackageManager } from '@config/types';

export interface DetectedManager {
  name: PackageManager;
  version: string | undefined;
}

// A command rather than an id, so `yarn-classic` is refused and a sixth manager is one row.
const isAgentName = (name: string): name is PackageManager => {
  return isValueOf(name, MANAGER_BINARIES) && MANAGER_BINARIES[name] === name;
};

// pnpm's own agent carries `node/?` rather than a Node version.
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

  const version = token
    .slice(name.length + 1)
    .replace(/\/.*/su, '');

  // Yarn says `yarn` whichever it is, so the major decides; no version is taken for Berry.
  return {
    name: name === 'yarn' && /^1\.\d+\.\d+$/u.test(version) ? 'yarn-classic' : name,
    version: /^\d+\.\d+\.\d+$/u.test(version) ? version : undefined,
  };
};

// Both yarns write `yarn.lock`: Classic opens with a banner, Berry carries `__metadata`.
export const yarnFromLockfile = (text: string | null): PackageManager => {
  return text?.includes('# yarn lockfile v1') === true ? 'yarn-classic' : 'yarn';
};

export const acceptsManager = (pm: PackageManager, version: string): boolean => {
  return rankOf(version) >= rankOf(MANAGER_FLOORS[pm]);
};

// Asked first, so the version `managerRefusal` reads is always a real one.
export const unversionedRefusal = (pm: PackageManager): string => {
  return `${pm} ran this, but \`${pm} --version\` answers nothing. Install it and run this again.`;
};

// Answered before the questionnaire: nobody should answer a dozen questions to hear their manager is too old.
export const managerRefusal = (pm: PackageManager, version: string): string | undefined => {
  if (acceptsManager(pm, version)) {
    return undefined;
  }

  // `yarn-classic` is not something anyone can type or install.
  const binary = MANAGER_BINARIES[pm];

  return `${binary} ${version} ran this, and a project this CLI writes needs ${binary} ${MANAGER_FLOORS[pm]} or `
    + 'newer. Upgrade it and run this again.';
};

// `NODE_FLOOR` carries why this differs from the `>=22.18` a project declares.
export const nodeRefusal = (running: string): string | undefined => {
  return rankOf(running) < rankOf(NODE_FLOOR)
    ? `Node ${running} is running this, and @linteljs/create needs Node ${NODE_FLOOR} or newer. `
    + 'Install it from https://nodejs.org and run this again.'
    : undefined;
};
