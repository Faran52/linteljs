import { RUN_PREFIX } from '../build-scripts/buildScripts';
import { NODE_ENGINE } from '../package-json/versions';

import type { Answers, PackageManager } from '../../model/answers/answers';

/**
 * Emits `.github/workflows/ci.yml`, the one workflow this standard owns. Everything else it ships is a gate that
 * nothing ran: a project got `check`, the hooks and the whole lint surface, and no push ever exercised them. A
 * reference repo renamed `check` and its workflow called the old name for two days, green locally and red on every
 * push, and `sync` reported the project fully up to date because `.github/` was nobody's.
 *
 * Emitted rather than preserved, unlike the build configs: this file *is* the gate, so a release that changes the
 * gate has to reach it, and a project with more to run adds `deploy.yml` beside it rather than editing this one.
 * That split is what makes a drifting `ci.yml` show up as a `sync` diff.
 */

interface ManagerSetup {
  // Steps before `setup-node`, for a manager whose binary the runner does not ship.
  before: string[];
  // What `actions/setup-node` caches for. Absent where the manager is not one of its known values.
  cache?: string;
  install: string;
}

// Pinned, not a floating major: `engines.node` declares a floor, and a runner resolving `24` to something below it
// would install a Node the project says it does not support.
const nodeVersion = (): string => {
  return NODE_ENGINE.replace(/^[>=~^]+/, '');
};

/**
 * A third-party action is pinned to the commit its tag pointed at, because a tag can be moved onto different code
 * without the reference here changing; GitHub's own actions go by major tag, which is the boundary they support.
 * The pnpm SHA is `v6.0.10` resolved through the tag object, checked against the registry rather than copied.
 */
const MANAGER_SETUP: Record<PackageManager, ManagerSetup> = {
  pnpm: {
    before: ['- uses: pnpm/action-setup@0977fd99725f1db4007ccb2928dbb4e90d06cc86 # v6.0.10'],
    cache: 'pnpm',
    install: 'pnpm install --frozen-lockfile',
  },
  // `npm ci` is the only install that refuses to edit the lockfile, which is what a gate wants.
  npm: {
    before: [],
    cache: 'npm',
    install: 'npm ci',
  },
  yarn: {
    before: [],
    cache: 'yarn',
    install: 'yarn install --immutable',
  },
  // No `cache`: `setup-node` knows npm, yarn and pnpm, and naming anything else fails the step outright.
  bun: {
    before: ['- uses: oven-sh/setup-bun@v2'],
    install: 'bun install --frozen-lockfile',
  },
};

export const emitCiWorkflow = (answers: Answers): string => {
  const setup = MANAGER_SETUP[answers.packageManager];

  const before = setup.before.map((step) => {
    return `      ${step}\n\n`;
  }).join('');

  const cache = setup.cache === undefined ? '' : `\n          cache: ${setup.cache}`;

  return `# The gate in front of every push, written by @linteljs/create. It runs exactly what \`${
    RUN_PREFIX[answers.packageManager]
  } check\`
# runs locally, so a green commit here means the same checks passed. Add a second workflow file
# beside this one for anything else; this one is replaced on every \`lintel sync\`.
name: ci

on:
  push:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

${before}      - uses: actions/setup-node@v7
        with:
          node-version: ${nodeVersion()}${cache}

      - run: ${setup.install}

      - run: ${RUN_PREFIX[answers.packageManager]} check
`;
};
