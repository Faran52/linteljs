import { MANAGER_FLOORS, NODE_FLOOR } from '@config/constants';

import { majorOf, rankOf } from '@utils/versionUtils';

import type { PackageManager } from '@answers';

export interface DetectedManager {
  name: PackageManager;
  version: string | undefined;
}

const isPackageManager = (name: string): name is PackageManager => {
  return name in MANAGER_FLOORS;
};

/**
 * The first token of `npm_config_user_agent`, read the way every scaffolder reads it:
 * `pnpm/12.5.1 npm/? node/? darwin arm64`. A name outside the four answers `undefined`, as does an unset agent, and
 * so does a version that is not one: pnpm's own agent carries `node/?` rather than a Node version.
 */
export const managerFromUserAgent = (userAgent: string | undefined): DetectedManager | undefined => {
  const [token = ''] = (userAgent ?? '').split(' ');
  const [name = '', version = ''] = token.split('/');

  if (!isPackageManager(name)) {
    return undefined;
  }

  return {
    name,
    version: /^\d+\.\d+\.\d+$/u.test(version) ? version : undefined,
  };
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

  // Yarn 1 is the one floor with its own sentence: the fix is a different command rather than an upgrade, since
  // yarn 1 forwards `dlx` and a `packageManager` field to a modern yarn on its own.
  if (pm === 'yarn' && majorOf(version) === 1) {
    return `yarn ${version} ran this. The projects this CLI writes are yarn 4 projects, and yarn 1 forwards to 4 `
      + 'on its own: run `yarn dlx @linteljs/create <name>`, or `yarn set version stable` in this directory first.';
  }

  return `${pm} ${version} ran this, and a project this CLI writes needs ${pm} ${MANAGER_FLOORS[pm]} or newer. `
    + 'Upgrade it and run this again.';
};

// The floor this CLI runs on, which is where `--experimental-strip-types` first exists, rather than the `>=22` a
// generated project declares: the two shipped `scripts/*.ts` run under that flag.
export const nodeRefusal = (running: string): string | undefined => {
  return rankOf(running) < rankOf(NODE_FLOOR)
    ? `Node ${running} is running this, and @linteljs/create needs Node ${NODE_FLOOR} or newer. `
    + 'Install it from https://nodejs.org and run this again.'
    : undefined;
};
