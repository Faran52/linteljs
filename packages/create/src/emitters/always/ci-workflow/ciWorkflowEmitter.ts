import { RUN_PREFIX } from '@config/constants';
import { type Artifact } from '@config/types';

import { majorOf } from '@utils/versionUtils';

import { emitted } from '../../utils/artifactUtils';

import type { HostedAnswers, PackageManager } from '@answers';

// The one workflow this standard owns, emitted rather than preserved because it is the gate: a reference repo renamed
// `check` and its workflow called the old name for two days while `sync` reported it up to date.

interface ManagerSetup {
  // Before `setup-node`, for a manager the runner does not ship.
  before: string[];
  // Absent where `setup-node` does not know the manager.
  cache?: string;
  install: string;
}

// The major of the Node that made the project, so CI runs what it was built on. A bare major cannot resolve below
// `engines.node`, which is a major too.
const nodeVersion = (answers: HostedAnswers): string => {
  return String(majorOf(answers.nodeVersion));
};

// Third-party actions are pinned to a commit, since a tag can move; GitHub's own go by major tag.
const MANAGER_SETUP: Record<PackageManager, ManagerSetup> = {
  'pnpm': {
    before: ['- uses: pnpm/action-setup@0977fd99725f1db4007ccb2928dbb4e90d06cc86 # v6.0.10'],
    cache: 'pnpm',
    install: 'pnpm install --frozen-lockfile',
  },
  // The only install that refuses to edit the lockfile.
  'npm': {
    before: [],
    cache: 'npm',
    install: 'npm ci',
  },
  'yarn': {
    before: [],
    cache: 'yarn',
    install: 'yarn install --immutable',
  },
  'yarn-classic': {
    before: [],
    cache: 'yarn',
    install: 'yarn install --frozen-lockfile',
  },
  // `setup-node` fails outright on a `cache` value it does not know.
  'bun': {
    before: ['- uses: oven-sh/setup-bun@v2'],
    install: 'bun install --frozen-lockfile',
  },
};

export const emitCiWorkflow = (answers: HostedAnswers): string => {
  const setup = MANAGER_SETUP[answers.packageManager];

  const before = setup.before.map((step) => {
    return `      ${step}\n\n`;
  }).join('');

  const cache = setup.cache === undefined ? '' : `\n          cache: ${setup.cache}`;

  return `# The gate in front of every push, written by @linteljs/create. It runs exactly what \`${
    RUN_PREFIX[answers.packageManager]
  } check\`
# runs locally, so a green commit here means the same checks passed. Add a second workflow file
# beside this one for anything else; this one is replaced on every \`linteljs sync\`.
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
          node-version: ${nodeVersion(answers)}${cache}

      - run: ${setup.install}

      - run: ${RUN_PREFIX[answers.packageManager]} check
`;
};

// The directory is named for `.github/workflows/ci.yml`, so the path is spelled here and nowhere else.
export const ciWorkflowEmitter = (answers: HostedAnswers): Artifact[] => {
  return [emitted('standard', '.github/workflows/ci.yml', emitCiWorkflow(answers))];
};
