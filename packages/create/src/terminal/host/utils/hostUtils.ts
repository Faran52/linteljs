import {
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

const isAgentName = (name: string): name is PackageManager => {
  return isValueOf(name, MANAGER_FLOORS);
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

  const detected: DetectedManager = {
    name,
    version: /^\d+\.\d+\.\d+$/u.test(version) ? version : undefined,
  };

  return detected;
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

  if (pm === 'yarn' && version.startsWith('1.')) {
    return 'Yarn 1 is not supported: install Yarn 4 and run this again.';
  }

  return `${pm} ${version} ran this, and a project this CLI writes needs ${pm} ${MANAGER_FLOORS[pm]} or `
    + 'newer. Upgrade it and run this again.';
};

// `NODE_FLOOR` carries why this differs from the `>=22.18` a project declares.
export const nodeRefusal = (running: string): string | undefined => {
  return rankOf(running) < rankOf(NODE_FLOOR)
    ? `Node ${running} is running this, and @linteljs/create needs Node ${NODE_FLOOR} or newer. `
    + 'Install it from https://nodejs.org and run this again.'
    : undefined;
};
