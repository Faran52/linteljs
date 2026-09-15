import { RUN_PREFIX } from '../build-scripts/buildScripts';
import { NODE_ENGINE } from '../package-json/versions';

import type { Answers, PackageManager } from '../../model/answers/answers';

// The one workflow this standard owns, emitted rather than preserved because it is the gate: a reference repo renamed
// `check` and its workflow called the old name for two days while `sync` reported it up to date.

interface ManagerSetup {
  // Before `setup-node`, for a manager the runner does not ship.
  before: string[];
  // Absent where `setup-node` does not know the manager.
  cache?: string;
  install: string;
}

// Pinned: a runner resolving a floating major below `engines.node` installs a Node the project rejects.
const nodeVersion = (): string => {
  return NODE_ENGINE.replace(/^[>=~^]+/, '');
};

// Third-party actions are pinned to a commit, since a tag can move; GitHub's own go by major tag.
const MANAGER_SETUP: Record<PackageManager, ManagerSetup> = {
  pnpm: {
    before: ['- uses: pnpm/action-setup@0977fd99725f1db4007ccb2928dbb4e90d06cc86 # v6.0.10'],
    cache: 'pnpm',
    install: 'pnpm install --frozen-lockfile',
  },
  // The only install that refuses to edit the lockfile.
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
  // `setup-node` fails outright on a `cache` value it does not know.
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
